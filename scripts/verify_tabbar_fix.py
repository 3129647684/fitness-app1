# Re-run preview with shorter viewports to verify TabBar labels aren't clipped
import sys, os
sys.path.insert(0, os.path.dirname(__file__))
from playwright.sync_api import sync_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
WEB_URL = 'http://localhost:8082'
TEST_USER = 'user1@example.com'
TEST_PASS = '123456'

def snap(page, name):
    p = os.path.join(ROOT, name)
    page.screenshot(path=p, full_page=False)
    print('SNAP', p)

def do_login(page):
    email = page.locator('input').first
    email.wait_for(state='visible', timeout=6000)
    email.fill(TEST_USER)
    page.locator('input').nth(1).fill(TEST_PASS)
    page.evaluate("""() => {
        const all = document.querySelectorAll('div, button, span, a');
        for (const el of all) {
            const t = (el.innerText||el.textContent||'').replace(/\\s+/g,' ').trim();
            if (t === '登录' || t.includes('立即登录')) {
                let cur = el; let i = 0;
                while (cur && i<10) {
                    if (cur.onclick != null || getComputedStyle(cur).cursor === 'pointer') break;
                    cur = cur.parentElement; i++;
                }
                (cur||el).click(); return;
            }
        }
    }""")
    page.wait_for_timeout(3500)

def goto_record(page):
    page.evaluate("""() => {
        const all = document.querySelectorAll('div, button, span, a');
        for (const el of all) {
            const t = (el.innerText||el.textContent||'').replace(/\\s+/g,' ').trim();
            if (t === '记录') {
                let cur = el; let i = 0;
                while (cur && i<10) {
                    if (cur.onclick != null || getComputedStyle(cur).cursor === 'pointer') break;
                    cur = cur.parentElement; i++;
                }
                (cur||el).click(); return;
            }
        }
    }""")
    page.wait_for_timeout(2500)

def scroll_all(page):
    page.evaluate("""() => {
        document.querySelectorAll('*').forEach(el => {
            try {
                const s = getComputedStyle(el);
                if (s.overflowY === 'auto' || s.overflowY === 'scroll') el.scrollTop = el.scrollHeight;
            } catch(e) {}
        });
        window.scrollTo(0, document.body.scrollHeight);
    }""")
    page.wait_for_timeout(500)

def clip_bottom(page, name, px=260):
    vp = page.viewport_size
    page.screenshot(path=os.path.join(ROOT, name),
                    clip={'x':0,'y':max(0,vp['height']-px),'width':vp['width'],'height':px},
                    scale='device')

def measure(page, tag):
    metrics = page.evaluate("""(t) => {
        const viewH = window.innerHeight;
        const all = Array.from(document.querySelectorAll('div, button, span, a'));
        const labels = {};
        for (const kw of ['首页', '记录', '日历', '趋势', '我的']) {
            for (const el of all) {
                const tx = (el.textContent||el.innerText||'').replace(/\\s+/g,' ').trim();
                if (tx === kw) {
                    const b = el.getBoundingClientRect();
                    if (!labels[kw] || labels[kw].y < b.y) labels[kw] = {y:b.y, h:b.height, bottom:b.y+b.height, fs:getComputedStyle(el).fontSize};
                }
            }
        }
        // tab container
        let containerBottom = viewH, containerTop = viewH - 80;
        for (const el of all) {
            const b = el.getBoundingClientRect();
            const inner = (el.innerText||'').replace(/\\s+/g,' ').trim();
            if ((inner.includes('首页') && inner.includes('记录') && (inner.includes('日历')||inner.includes('我的'))) && b.width > 250 && b.height > 40) {
                if (b.bottom <= viewH) { containerTop = b.y; containerBottom = b.bottom; break; }
            }
        }
        const saveBtn = (() => { for (const el of all) { const t = (el.innerText||'').replace(/\\s+/g,' ').trim(); if (t.includes('保存记录')) { const b = el.getBoundingClientRect(); return {y:b.y,h:b.height,bottom:b.y+b.height}; } } return null; })();
        return { tag:t, viewportHeight: viewH, tabContainerTop:containerTop, tabContainerBottom:containerBottom,
                 labelsClipped: Object.fromEntries(Object.entries(labels).map(([k,v])=>[k, {bottom:v.bottom, clippedPx: Math.max(0,v.bottom-containerBottom-0)}])),
                 labelsGlobalClipped: Object.fromEntries(Object.entries(labels).map(([k,v])=>[k, {bottom:v.bottom, clippedBelowViewport: Math.max(0,v.bottom-viewH)}])),
                 saveBottom: saveBtn ? saveBtn.bottom : null,
                 saveToTabGap: saveBtn ? containerTop - saveBtn.bottom : null,
        };
    }""", tag)
    import json as _json
    print(_json.dumps(metrics, ensure_ascii=False, indent=2))
    # detect any clipping
    clipped = [k for k,v in metrics['labelsGlobalClipped'].items() if v['clippedBelowViewport']>0]
    if clipped: print('⚠️  GLOBAL CLIPPED labels:', clipped)
    else: print('✅ All 5 labels fully inside viewport bottom')

with sync_playwright() as pw:
    browser = pw.chromium.launch(headless=True)
    # Test 2 viewports: iPhone 14 (390x844) and iPhone SE 2022 (375x667) — also try 736 iPhone 8 Plus-like
    for VP_W, VP_H, VP_LBL in [(390, 844, 'iPhone14'), (375, 667, 'iPhoneSE'), (390, 736, 'iPhone8Plus')]:
        ctx = browser.new_context(viewport={'width':VP_W,'height':VP_H}, device_scale_factor=2)
        page = ctx.new_page()
        page.goto(WEB_URL, wait_until='domcontentloaded', timeout=20000)
        page.wait_for_timeout(2500)
        do_login(page)
        goto_record(page)
        scroll_all(page)
        snap(page, f'fix_tab_{VP_LBL}_full.png')
        clip_bottom(page, f'fix_tab_{VP_LBL}_bottom.png', px=280)
        measure(page, VP_LBL)
        ctx.close()
    browser.close()

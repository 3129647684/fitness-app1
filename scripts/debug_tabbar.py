# Debug TabBar label clipping
import sys, os, time
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

def find_by_text(page, keyword):
    return page.evaluate("""(key) => {
        const all = document.querySelectorAll('div, button, span, a');
        let best = null; let bestLen = Infinity;
        for (const el of all) {
            const txt = (el.innerText || el.textContent || '').replace(/\\s+/g, ' ').trim();
            if (!txt) continue;
            if (txt.includes(key) && txt.length < bestLen) {
                bestLen = txt.length; best = el;
            }
        }
        return best ? {
            ok: true, text: best.innerText.slice(0,30),
            box: best.getBoundingClientRect().toJSON ? best.getBoundingClientRect().toJSON() : {x:best.getBoundingClientRect().x,y:best.getBoundingClientRect().y,w:best.getBoundingClientRect().width,h:best.getBoundingClientRect().height}
        } : { ok: false };
    }""", keyword)

with sync_playwright() as pw:
    browser = pw.chromium.launch(headless=True)
    ctx = browser.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2)
    page = ctx.new_page()
    warnings, errors = [], []
    page.on('console', lambda m: (warnings.append(m.text[:220]) if m.type in ('warning','warn') else (errors.append(m.text[:220]) if m.type=='error' else None)))
    page.goto(WEB_URL, wait_until='domcontentloaded', timeout=20000)
    page.wait_for_timeout(3000)
    print('LANDING TITLE', page.title()[:60])
    snap(page, 'debug_tab_0_login.png')

    # Fill credentials (placeholder or label based match)
    try:
        email = page.locator('input').first
        email.wait_for(state='visible', timeout=5000)
        email.fill(TEST_USER)
        # find password input: second input
        pwd = page.locator('input').nth(1)
        pwd.fill(TEST_PASS)
        snap(page, 'debug_tab_0b_filled.png')
        # click login — find element with '登录' text
        page.evaluate("""() => {
            const all = document.querySelectorAll('div, button, span, a');
            for (const el of all) {
                const t = (el.innerText||el.textContent||'').replace(/\\s+/g,' ').trim();
                if (t === '登录' || t.includes('立即登录') || t.includes('Login')) {
                    el.click(); return;
                }
            }
        }""")
        print('→ submit login')
        page.wait_for_timeout(3000)
        snap(page, 'debug_tab_0c_post_login.png')
    except Exception as e:
        print('login error', e)

    # navigate to 记录 tab
    try:
        record = find_by_text(page, '记录')
        print('  记录 定位:', record)
        if record.get('ok'):
            page.evaluate("""() => {
                const all = document.querySelectorAll('div, button, span, a');
                for (const el of all) {
                    const t = (el.innerText||el.textContent||'').replace(/\\s+/g,' ').trim();
                    if (t === '记录') {
                        // find clickable ancestor
                        let cur = el; let i = 0;
                        while (cur && i<10) {
                            if (cur.onclick != null || getComputedStyle(cur).cursor === 'pointer') break;
                            cur = cur.parentElement; i++;
                        }
                        (cur||el).click(); return;
                    }
                }
            }""")
            print('→ clicked 记录 tab')
            page.wait_for_timeout(2500)
    except Exception as e:
        print('record tab err', e)

    snap(page, 'debug_tab_1_record_view.png')

    # Scroll to very bottom
    page.evaluate("""() => {
        const sv = document.querySelector('div[style*="overflow-y: auto"], div[data-rn-sv="true"], main > div');
        // just scroll all scrollable containers
        document.querySelectorAll('*').forEach(el => {
            try {
                const s = getComputedStyle(el);
                if (s.overflowY === 'auto' || s.overflowY === 'scroll') el.scrollTop = el.scrollHeight;
            } catch(e) {}
        });
        window.scrollTo(0, document.body.scrollHeight);
    }""")
    page.wait_for_timeout(800)
    snap(page, 'debug_tab_2_record_bottom_before.png')

    # Measure TabBar: find the bottom container that has both 首页 and 设置 labels
    metrics = page.evaluate("""() => {
        const viewH = window.innerHeight;
        const all = Array.from(document.querySelectorAll('div, button, span, a'));
        let tabBarEl = null;
        // find container containing text '首页' AND '我的' AND '设置' or '趋势' in children
        for (const el of all) {
            const txt = (el.innerText||'').replace(/\\s+/g,' ').trim();
            if ((txt.includes('首页') && txt.includes('我的')) || (txt.includes('首页') && txt.includes('记录') && txt.includes('日历'))) {
                const box = el.getBoundingClientRect();
                // must be near bottom and have reasonable height (40–120) and full width (>200)
                if (box.height > 40 && box.height < 160 && box.width > 200 && box.y + box.height >= viewH - 4) {
                    if (!tabBarEl || (tabBarEl.getBoundingClientRect().y < box.y)) tabBarEl = el;
                }
            }
        }
        const tb = tabBarEl ? tabBarEl.getBoundingClientRect() : null;
        const tbStyle = tabBarEl ? {
            height: getComputedStyle(tabBarEl).height,
            paddingBottom: getComputedStyle(tabBarEl).paddingBottom,
            paddingTop: getComputedStyle(tabBarEl).paddingTop,
            boxSizing: getComputedStyle(tabBarEl).boxSizing,
        } : null;
        // Find 首页 label element
        let labelBoxes = {};
        for (const kw of ['首页', '记录', '日历', '趋势', '我的']) {
            for (const el of all) {
                const t = (el.textContent||el.innerText||'').replace(/\\s+/g,' ').trim();
                if (t === kw) {
                    const box = el.getBoundingClientRect();
                    // pick the one closest to bottom
                    if (!labelBoxes[kw] || labelBoxes[kw].box.y < box.y) {
                        labelBoxes[kw] = { text: t, box: {x:box.x,y:box.y,w:box.width,h:box.height}, computed: {fontSize: getComputedStyle(el).fontSize, padding: getComputedStyle(el).padding, height: getComputedStyle(el).height, overflow: getComputedStyle(el).overflow}};
                    }
                }
            }
        }
        // Also find Tab icons bounding (parent of each label)
        return {
            viewportHeight: viewH,
            tabBarFound: !!tabBarEl,
            tabBarBox: tb ? {x:tb.x,y:tb.y,w:tb.width,h:tb.height} : null,
            tabBarComputed: tbStyle,
            labels: labelBoxes,
            clippedLabels: Object.fromEntries(Object.entries(labelBoxes).map(([k,v]) => [k, {
                labelBottom: v.box.y + v.box.h,
                clippedBy: (v.box.y + v.box.h) - viewH,  // >0 means portion clipped beyond viewport bottom
            }])),
        };
    }""")
    import json as _json
    print('TABBAR METRICS:')
    print(_json.dumps(metrics, ensure_ascii=False, indent=2))

    # Extra: if there's clipping (clippedBy > 0), also measure 保存记录 bar
    saveMetrics = page.evaluate("""() => {
        const all = Array.from(document.querySelectorAll('div, button, span, a'));
        for (const el of all) {
            const t = (el.innerText||'').replace(/\\s+/g,' ').trim();
            if (t.includes('保存记录') && !t.includes('今日')) {
                let cur = el; let i = 0;
                while (cur && i < 5) {
                    const s = getComputedStyle(cur);
                    if (s.position === 'absolute' || s.position === 'fixed') break;
                    cur = cur.parentElement; i++;
                }
                const bb = (cur||el).getBoundingClientRect();
                return { ok:!!cur, box:{x:bb.x,y:bb.y,w:bb.width,h:bb.height},
                         computed: cur ? {position:getComputedStyle(cur).position,bottom:getComputedStyle(cur).bottom,paddingBottom:getComputedStyle(cur).paddingBottom,paddingTop:getComputedStyle(cur).paddingTop,height:getComputedStyle(cur).height} : null,
                         textMatch: t.slice(0,20) };
            }
        }
        return { ok:false };
    }""")
    print('SAVE BAR METRICS:')
    print(_json.dumps(saveMetrics, ensure_ascii=False, indent=2))

    # Screenshot with a small window padding at bottom — use clip to show exact bottom 220px region
    vp = page.viewport_size
    clip_w, clip_h = vp['width'], 260
    clip_x, clip_y = 0, vp['height'] - clip_h
    page.screenshot(path=os.path.join(ROOT, 'debug_tab_3_bottom_clip.png'), clip={'x':clip_x,'y':clip_y,'width':clip_w,'height':clip_h}, scale='device')
    print('CLIP SNAP bottom 260px region')

    browser.close()
    print()
    print('ERRORS:', list(dict.fromkeys(errors))[:5])
    print('WARNINGS (unique):', list(dict.fromkeys(warnings))[:5])

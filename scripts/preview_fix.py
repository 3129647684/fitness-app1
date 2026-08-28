"""
Clean UI-only login flow (no zustand injection tricks), navigate screens, capture screenshots.
"""
import os
import json
import requests
from playwright.sync_api import sync_playwright

OUT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BASE = 'http://localhost:4000'
WEB = 'http://localhost:8082'
USER = 'previewfix03'
PASS = 'preview123'


def snap(page, name):
    path = os.path.join(OUT, name)
    page.screenshot(path=path, full_page=False)
    print('SNAP', path)


def snap_full(page, name):
    path = os.path.join(OUT, name)
    page.screenshot(path=path, full_page=True)
    print('FULL', path)


errors = []
warnings = []


def on_console(msg):
    if msg.type == 'error':
        errors.append(msg.text)
    elif msg.type == 'warning':
        warnings.append(msg.text)


def rn_scroll(page, dy):
    """Scroll the largest scrollable element on the page (RN Web ScrollView as overflow:auto div).
    Returns (scrollTop, scrollHeight, clientHeight) for debugging.
    """
    info = page.evaluate("""dy => {
        let best = document.scrollingElement || document.documentElement;
        let bestHeight = best.scrollHeight;
        const all = document.querySelectorAll('*');
        for (let i = 0; i < all.length; i++) {
            const el = all[i];
            const st = getComputedStyle(el);
            const ov = st.overflowY;
            if ((ov === 'scroll' || ov === 'auto') && el.scrollHeight > el.clientHeight + 100) {
                if (el.scrollHeight > bestHeight) {
                    bestHeight = el.scrollHeight;
                    best = el;
                }
            }
        }
        best.scrollTop = Math.max(0, Math.min(best.scrollHeight - best.clientHeight, best.scrollTop + dy));
        return {scrollTop: best.scrollTop, scrollHeight: best.scrollHeight, clientHeight: best.clientHeight};
    }""", dy)
    page.wait_for_timeout(260)
    return info


def scroll_to_bottom(page):
    for _ in range(12):
        info = rn_scroll(page, 1600)
        if info['scrollTop'] + info['clientHeight'] >= info['scrollHeight'] - 8:
            break
    page.wait_for_timeout(600)


def scroll_to_ratio(page, r):
    """Scroll to r ∈ [0,1] proportion of total scroll distance."""
    info = rn_scroll(page, 0)
    target = int((info['scrollHeight'] - info['clientHeight']) * r)
    delta = target - info['scrollTop']
    if abs(delta) > 0:
        rn_scroll(page, delta)
    page.wait_for_timeout(300)


with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    ctx = browser.new_context(viewport={'width': 390, 'height': 844},
                              device_scale_factor=2, is_mobile=True,
                              locale='zh-CN', timezone_id='Asia/Shanghai')
    page = ctx.new_page()
    page.on('console', on_console)
    page.on('pageerror', lambda e: errors.append('PAGE_ERROR:' + str(e)))

    page.goto(WEB, wait_until='networkidle')
    page.wait_for_timeout(2000)
    print('LANDING TITLE', page.title())
    snap(page, 'preview_0_login.png')

    # Ensure on login tab (not register)
    login_tab = page.locator('text="登录"').nth(0)
    login_tab.click(timeout=2500)
    page.wait_for_timeout(300)

    # Fill fields — React Native Web uses placeholder attribute directly
    name_input = page.get_by_placeholder('用户名')
    name_input.wait_for(state='visible', timeout=4000)
    name_input.click()
    name_input.fill(USER)
    pwd_input = page.get_by_placeholder('密码（至少 6 位）')
    pwd_input.click()
    pwd_input.fill(PASS)
    snap(page, 'preview_0b_filled.png')

    # Click submit button (the green one under fields — not the segment tab)
    # Use locator with the button's own unique characteristics: green block contains "登录"
    submit_btn = page.locator('text="登录"').nth(1)
    try:
        submit_btn.click(timeout=4000)
    except Exception:
        # Fallback: the only big block on screen is green submit, click via DOM structure
        page.keyboard.press('Enter')
    print('→ submit login')
    page.wait_for_timeout(3500)  # wait for POST + replace MainTabs
    snap(page, 'preview_0c_post_login.png')

    # ===== Go to Record tab =====
    # Tab bar text labels: 首页 / 记录 / 日历 / 趋势 / 我的
    # RN Web may render text via separate <span> in tab bar. Attempt several strings.
    vb = page.viewport_size
    clicked_record = False
    for label in ['记录', '记录·']:
        try:
            lc = page.locator(f'text="{label}"')
            if lc.count() > 0:
                lc.first.click(timeout=2500)
                clicked_record = True
                print(f'→ clicked record tab by text {label!r}')
                break
        except Exception:
            pass
    if not clicked_record:
        # Bottom tab bar is ~80px high; tabs are at 0.1, 0.3, 0.5 (center +), 0.7, 0.9 width fractions
        # Index=0首页, 1记录, 2日历/中间, 3趋势, 4我的
        x = vb['width'] * 0.3
        y = vb['height'] - 40
        print(f'→ fallback click tab 1 by ({x:.0f},{y:.0f})')
        page.mouse.click(x, y)
        clicked_record = True
    page.wait_for_timeout(1800)
    snap(page, 'preview_1_record_top.png')

    # ===== Expand the 今日运动记录（明细）section first (默认 showSport=false 折叠) =====
    # 今日饮食记录同理展开，确保所有按钮可点
    def click_ancestor_by_text(pg, keyword: str, upward_max=10):
        return page.evaluate(f"""() => {{
            const key = {repr(keyword)};
            const all = document.querySelectorAll('div, button, span, a, p');
            let leaf = null; let bestLen = Infinity;
            for (const el of all) {{
                const txt = (el.innerText || el.textContent || '').replace(/\\s+/g, ' ').trim();
                if (!txt) continue;
                if (txt.includes(key) && txt.length < bestLen) {{
                    bestLen = txt.length; leaf = el;
                }}
            }}
            if (!leaf) return {{ ok: false }};
            // walk up until we find something clickable (onPress attached or has pointer cursor or isTouchable/RNWeb div with onClick)
            let cur = leaf; let i = 0;
            while (cur && i < {upward_max}) {{
                if ((cur.onclick != null) || (typeof cur.__reactProps$ !== 'undefined') || window.getComputedStyle(cur).cursor === 'pointer') {{
                    cur.scrollIntoView({{block: 'center'}});
                    cur.click();
                    return {{ ok: true, traversed: i, text: (cur.innerText||'').slice(0,40) }};
                }}
                cur = cur.parentElement; i++;
            }}
            // fallback: click the leaf nearest container anyway
            leaf.scrollIntoView({{block: 'center'}});
            leaf.click();
            return {{ ok: true, fallback: true }};
        }}""")

    expand_sport = click_ancestor_by_text(page, '今日运动记录（明细）')
    print('  expand 今日运动记录（明细）:', expand_sport)
    page.wait_for_timeout(600)
    expand_food = click_ancestor_by_text(page, '今日饮食记录')
    print('  expand 今日饮食记录:', expand_food)
    page.wait_for_timeout(600)

    # ===== Find & click 添加力量动作 — brute force search via innerText =====
    snap(page, 'preview_1b_before_add.png')
    try:
        # JS: find clickable element whose inner text contains the target (leaf or near-leaf)
        found = page.evaluate("""() => {
            const target = '添加力量动作';
            const all = document.querySelectorAll('div, button, span, a');
            let best = null;
            let bestLen = Infinity;
            for (const el of all) {
                const txt = (el.innerText || el.textContent || '').replace(/\\s+/g, ' ').trim();
                if (!txt) continue;
                if (txt.includes(target) && txt.length < bestLen) {
                    bestLen = txt.length;
                    best = el;
                }
            }
            if (best) {
                // find nearest clickable ancestor (10 steps up)
                let cur = best; let i = 0;
                while (cur && i < 10) {
                    if (cur.onclick != null || window.getComputedStyle(cur).cursor === 'pointer') break;
                    cur = cur.parentElement; i++;
                }
                const node = cur || best;
                node.scrollIntoView({block: 'center'});
                const r = node.getBoundingClientRect();
                node.click();
                return { ok: true, text: (best.innerText||'').slice(0,60), box: {x:r.x,y:r.y,w:r.width,h:r.height} };
            }
            return { ok: false, hints: [...document.querySelectorAll('div,span,button')].map(e => (e.innerText||'').replace(/\\s+/g,' ').trim()).filter(t => t && (t.includes('力量')||t.includes('训练动作')||t.includes('有氧')||t.includes('运动'))).slice(0, 20) };
        }""")
        print('  添加力量动作 search:', found)
        if not found.get('ok'):
            raise RuntimeError(f"not found, nearby hints: {found.get('hints', [])[:10]}")
        print('→ 添加力量动作 modal')
        page.wait_for_timeout(1200)
        snap(page, 'preview_str_modal.png')

        picked = page.evaluate("""() => {
            const target = '选择训练动作';
            const all = document.querySelectorAll('div, button, span, a');
            let best = null;
            let bestLen = Infinity;
            for (const el of all) {
                const txt = (el.innerText || el.textContent || '').replace(/\\s+/g, ' ').trim();
                if (!txt) continue;
                if (txt.includes(target) && txt.length < bestLen) {
                    bestLen = txt.length;
                    best = el;
                }
            }
            if (best) {
                let cur = best; let i = 0;
                while (cur && i < 10) {
                    if (cur.onclick != null || window.getComputedStyle(cur).cursor === 'pointer') break;
                    cur = cur.parentElement; i++;
                }
                (cur||best).scrollIntoView({block: 'center'});
                (cur||best).click();
                return { ok: true };
            }
            return { ok: false, hints: [...document.querySelectorAll('div,span,button')].map(e => (e.innerText||'').replace(/\\s+/g,' ').trim()).filter(t => t && t.includes('训练')).slice(0, 15) };
        }""")
        if picked.get('ok'):
            print('→ 选择训练动作 screen')
            page.wait_for_timeout(1800)
        else:
            print('WARN 选择训练动作 not found, hints:', picked.get('hints', []))
        snap(page, 'preview_02_exercise_sidebar.png')
    except Exception as e:
        print('WARN exercise flow:', e)
        snap(page, 'preview_02_exercise_sidebar.png')

    # ===== Finally scroll to bottom → body circ card + save bar (bottom no clipping check) =====
    scroll_to_bottom(page)
    snap(page, 'preview_01_record_bottom.png')
    snap_full(page, 'preview_01_record_full.png')

    ctx.close()
    browser.close()

print('\nERRORS:', errors[:12])
print('WARNINGS (unique):', list(dict.fromkeys(warnings))[:15])

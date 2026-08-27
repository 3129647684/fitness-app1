import sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b = p.chromium.launch(headless=True)
    page = b.new_page(viewport={'width': 1280, 'height': 800})
    page.goto('http://localhost:8082', wait_until='domcontentloaded')
    page.wait_for_timeout(4000)
    # dump 页面底部 TabBar 区域的所有可点击元素
    html = page.evaluate("""() => {
      const els = [...document.querySelectorAll('[role=tab], [role=button], [aria-selected]')];
      return els.slice(0, 20).map(e => {
        const r = e.getBoundingClientRect();
        return { tag: e.tagName, role: e.getAttribute('role'), text: e.textContent.trim().slice(0,20),
                 bottom: Math.round(r.bottom), top: Math.round(r.top) };
      });
    }""")
    print('TABBAR ELEMENTS:')
    for e in html:
        print(' ', e)
    # 找到屏幕底部 y>700 的点击元素
    footer = page.evaluate("""() => {
      const ov = document.getElementById('webpack-dev-server-client-overlay');
      if (ov) ov.remove();
      const els = [...document.querySelectorAll('div,span')].filter(n => {
        const r = n.getBoundingClientRect();
        return n.children.length===0 && r.bottom > 700 && r.top > 600 && n.textContent.trim();
      });
      return els.slice(0,10).map(e => ({ t: e.textContent.trim().slice(0,15), top: Math.round(e.getBoundingClientRect().top) }));
    }""")
    print('FOOTER ELEMENTS:')
    for e in footer:
        print(' ', e)
    b.close()

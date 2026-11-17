"""Bộ kiểm thử nhanh Cozy Life OS (chạy trong trình duyệt Chrome tự động).
Cách chạy:  python3 tests/smoke.py   (cần: pip install playwright icalendar; có Chrome)
Mỗi bài thử mở app mới tinh, bấm như người dùng và kiểm tra kết quả bằng assert."""
import asyncio, datetime, json, os, subprocess, sys, time, tempfile
from playwright.async_api import async_playwright
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PORT = int(os.environ.get('COZY_PORT', '8799')); URL = f'http://localhost:{PORT}/'
TZ = datetime.timezone(datetime.timedelta(hours=7))
CHROME = os.environ.get('CHROME', '/usr/bin/google-chrome')
OUT = tempfile.mkdtemp(prefix='cozy-test-')
results = []

async def page(p, when=None, sw='block'):
    b = await p.chromium.launch(executable_path=CHROME, args=['--no-sandbox'])
    ctx = await b.new_context(viewport={'width': 390, 'height': 844}, service_workers=sw, timezone_id='Asia/Ho_Chi_Minh',
                              color_scheme='light', accept_downloads=True)
    pg = await ctx.new_page(); pg.errs = []
    pg.on('pageerror', lambda e: pg.errs.append(str(e)))
    if when: await pg.clock.install(time=when)
    await pg.goto(URL)
    if when: await pg.clock.run_for(1500)
    else: await pg.wait_for_timeout(1200)
    return b, ctx, pg

def T(name):
    def deco(fn):
        async def run(p):
            t0 = time.time()
            try:
                await fn(p); results.append((name, True, '')); print(f'✅ {name} ({time.time()-t0:.1f}s)')
            except Exception as e:
                results.append((name, False, repr(e)[:300])); print(f'❌ {name}: {repr(e)[:300]}')
        run.__name__ = name; TESTS.append(run); return run
    return deco
TESTS = []
txt = lambda pg, sel: pg.inner_text(sel)

@T('Lưu dữ liệu, sao lưu (thường + mật khẩu), khôi phục, bản chụp, offline')
async def t_storage(p):
    b, ctx, pg = await page(p, sw='allow')
    await pg.fill('#candy', 'Kẹo thử'); await pg.click('#candyF button'); await pg.wait_for_timeout(5000)
    await pg.locator('.habit').first.wait_for()
    await pg.fill('[data-tt="0"]', 'Việc A'); await pg.press('[data-tt="0"]', 'Tab'); await pg.wait_for_timeout(600)
    await pg.reload(); await pg.wait_for_timeout(1500)
    assert await pg.input_value('[data-tt="0"]') == 'Việc A'
    assert '1 viên' in await txt(pg, '#view')
    await pg.click('[data-tab=set]'); await pg.click('[data-sp=data]')
    async with pg.expect_download() as d: await pg.click('#datacard [data-a=export]')
    f1 = os.path.join(OUT, 'b.json'); await (await d.value).save_as(f1)
    assert 'Việc A' in open(f1).read()
    await pg.fill('#bkpw', 'mk123')
    async with pg.expect_download() as d: await pg.click('#datacard [data-a=export]')
    f2 = os.path.join(OUT, 'enc.json'); await (await d.value).save_as(f2)
    assert json.load(open(f2))['encrypted'] and 'Việc A' not in open(f2).read()
    await pg.click('summary:has-text("Xóa dữ liệu")'); await pg.click('[data-a=reset]'); await pg.click('[data-a=reset]'); await pg.wait_for_timeout(800)
    assert '0 viên' in await txt(pg, '#view')
    await pg.click('[data-tab=set]'); await pg.click('[data-sp=data]')
    async with pg.expect_file_chooser() as fc: await pg.click('#datacard [data-a=import]')
    await (await fc.value).set_files(f2); await pg.wait_for_timeout(400)
    await pg.fill('#impw', 'sai'); await pg.click('[data-a=impw]'); await pg.wait_for_timeout(1500)
    assert await pg.locator('.err').count() == 1
    await pg.fill('#impw', 'mk123'); await pg.click('[data-a=impw]'); await pg.wait_for_timeout(1500)
    await pg.click('[data-a=doImport]'); await pg.wait_for_timeout(1000)
    assert await pg.input_value('[data-tt="0"]') == 'Việc A'
    await pg.click('[data-tab=set]'); await pg.click('[data-sp=data]'); await pg.click('summary:has-text("Bản chụp")')
    assert await pg.locator('[data-snap]').count() >= 2
    await pg.wait_for_timeout(1500); await ctx.set_offline(True); await pg.reload(); await pg.wait_for_timeout(1500)
    assert 'Cozy' in await pg.title() and await pg.locator('[data-tab]').count() == 5
    assert not pg.errs, pg.errs; await b.close()

@T('Việc: nhóm, chi tiết, việc con, ⭐ Top 3, xóa')
async def t_tasks(p):
    b, ctx, pg = await page(p, datetime.datetime(2026, 11, 18, 9, 0, tzinfo=TZ))
    await pg.click('[data-tab=tasks]')
    for g, n in [('work', 'Báo cáo'), ('family', 'Gọi mẹ')]:
        await pg.click(f'[data-tg={g}]'); await pg.fill('#tnew', n); await pg.press('#tnew', 'Enter')
    await pg.click('.tmain:has-text("Báo cáo")'); await pg.click('[data-tquick="0"]')
    await pg.fill('#subNew', 'Thu số liệu'); await pg.press('#subNew', 'Enter'); await pg.click('[data-sub]')
    await pg.click('[data-a=tSave]')
    assert '☑️ 1/1' in await txt(pg, '.trow:has-text("Báo cáo")')
    await pg.click('.trow:has-text("Báo cáo") .star'); await pg.click('[data-tab=today]')
    assert await pg.locator('.t3link:has-text("Báo cáo")').count() == 1
    await pg.locator('[data-t="0"]').check(); await pg.click('[data-tab=tasks]')
    assert 'Đã xong (1)' in await txt(pg, '#view')
    await pg.click('.tmain:has-text("Gọi mẹ")'); await pg.click('[data-a=tDel]'); await pg.click('[data-a=tDel]')
    assert await pg.locator('.tt:has-text("Gọi mẹ")').count() == 0
    assert not pg.errs, pg.errs; await b.close()

@T('Nhắc nhở: file .ics hợp lệ, Chibi giơ bảng nhắc')
async def t_remind(p):
    from icalendar import Calendar
    b, ctx, pg = await page(p, datetime.datetime(2026, 11, 18, 9, 0, tzinfo=TZ))
    await pg.click('[data-tab=tasks]'); await pg.fill('#tnew', 'Nộp báo cáo quý'); await pg.press('#tnew', 'Enter')
    await pg.click('.tmain:has-text("Nộp báo cáo")'); await pg.click('[data-tquick="0"]'); await pg.fill('#tTime', '14:00'); await pg.press('#tTime', 'Tab')
    await pg.click('[data-tlead="60"]')
    async with pg.expect_download() as d: await pg.click('[data-bell=set]')
    f = os.path.join(OUT, 't.ics'); await (await d.value).save_as(f)
    ev = Calendar.from_ical(open(f, 'rb').read()).walk('VEVENT')[0]
    assert ev.decoded('DTSTART').astimezone(TZ).hour == 14 and str(ev.walk('VALARM')[0].decoded('TRIGGER')) == '-1 day, 23:00:00'
    await pg.click('[data-a=backTask]'); await pg.click('[data-tlv=chibi]'); await pg.fill('#tTime', '09:20'); await pg.press('#tTime', 'Tab'); await pg.click('[data-a=tSave]')
    await pg.click('[data-tab=today]'); await pg.clock.run_for(36000)
    assert await pg.locator('#nudge.show .board').count() == 1
    await pg.click('[data-nudge=stop]'); await pg.clock.run_for(600)
    assert await pg.locator('#nudge.hide').count() == 1
    assert not pg.errs, pg.errs; await b.close()

@T('Pomodoro: chạy, nhớ giờ khi tải lại, xong phiên, đổi độ dài')
async def t_pomo(p):
    b, ctx, pg = await page(p, datetime.datetime(2026, 11, 18, 9, 0, tzinfo=TZ))
    await pg.click('[data-tab=tasks]'); await pg.click('[data-a=pomoGo]'); await pg.clock.run_for(61000)
    await pg.reload(); await pg.clock.run_for(1500); await pg.click('[data-tab=tasks]'); await pg.clock.run_for(1100)
    assert (await txt(pg, '#pTime')).startswith('23:')
    await pg.clock.run_for(25 * 60 * 1000)
    assert 'Nghỉ ngắn' in await txt(pg, '.pmode') and '1 phiên' in await txt(pg, '.pomo h2 small')
    await pg.click('[data-a=pomoSkip]'); await pg.click('summary:has-text("Tùy chọn")'); await pg.click('[data-plen="45"]')
    assert await txt(pg, '#pTime') == '45:00'
    assert not pg.errs, pg.errs; await b.close()

@T('Gym: lịch tập, gợi ý, ghi set, nghỉ, kỷ lục, ốm → giãn cơ')
async def t_gym(p):
    b, ctx, pg = await page(p, datetime.datetime(2026, 11, 16, 17, 0, tzinfo=TZ))
    await pg.click('[data-tab=health]'); await pg.click('[data-htab=gym]')
    for d in ['1', '3', '5']: await pg.click(f'[data-gday="{d}"]')
    await pg.click('[data-geq=db]')
    assert 'Đẩy' in await txt(pg, '#view .card h2')
    await pg.click('[data-a=woStart]'); await pg.fill('[data-wk="0:0"]', '8'); await pg.press('[data-wk="0:0"]', 'Tab'); await pg.click('[data-wd="0:0"]')
    assert (await txt(pg, '#restT')) == '01:30'
    await pg.click('[data-a=restSkip]'); await pg.click('[data-a=woFinish]'); await pg.click('[data-a=closeSheet]')
    await pg.clock.fast_forward(72 * 3600 * 1000); await pg.clock.run_for(1000)
    await pg.click('[data-tab=today]'); await pg.click('[data-tab=health]')
    await pg.click('[data-a=woPickGroups]'); await pg.click('[data-gpick=chest]'); await pg.click('[data-a=woStartPicked]')
    assert await pg.input_value('[data-wk="0:0"]') == '8'
    await pg.fill('[data-wk="0:0"]', '10'); await pg.press('[data-wk="0:0"]', 'Tab'); await pg.click('[data-wd="0:0"]'); await pg.click('[data-a=restSkip]'); await pg.click('[data-a=woFinish]')
    assert 'Kỷ lục mới' in await txt(pg, '#sheet'); await pg.click('[data-a=closeSheet]')
    await pg.click('[data-a=exLib]'); await pg.fill('#libQ', 'vai'); assert await pg.locator('#libList .sgrow').count() >= 3
    await pg.locator('#libList .sgrow').first.click(); await pg.wait_for_timeout(500)
    assert await pg.locator('.bodymap svg').count() == 2 and await pg.locator('.eximgs img').count() >= 1
    await pg.click('[data-a=closeSheet]')
    assert not pg.errs, pg.errs; await b.close()

@T('Uống nước: mục tiêu, gợi ý theo cân nặng, lịch sử, ghi bù')
async def t_water(p):
    b, ctx, pg = await page(p, datetime.datetime(2026, 11, 18, 10, 0, tzinfo=TZ))
    await pg.click('[data-tab=set]'); await pg.click('[data-sp=water]')
    await pg.fill('#wkg', '50'); await pg.press('#wkg', 'Tab'); await pg.click('[data-wact=mid]'); await pg.click('[data-wml="300"]')
    assert '1,85 lít – 2,1 lít' in await txt(pg, '#view'); await pg.click('[data-a=wUse]')
    assert '7 ly × 300 ml = 2,1 lít' in await txt(pg, '#view')
    await pg.click('[data-tab=health]'); await pg.click('[data-htab=water]')
    await pg.click('.wcell[data-wday="2026-11-17"]')
    for _ in range(7): await pg.click('[data-wdc="1"]')
    await pg.click('[data-a=closeSheet]')
    assert '7' in await pg.locator('.wbar .wv').nth(5).inner_text()
    assert not pg.errs, pg.errs; await b.close()

@T('Thói quen, Thời gian biểu, Ghi chú nhanh, Cài đặt dạng menu')
async def t_today(p):
    b, ctx, pg = await page(p, datetime.datetime(2026, 11, 18, 9, 30, tzinfo=TZ))
    await pg.click('[data-a=schedAdd]'); await pg.fill('#sT', '12:00'); await pg.fill('#sTitle', 'Ăn trưa'); await pg.click('[data-f=rep][data-v="1"]'); await pg.click('[data-a=schedSave]')
    assert '12:00' in await txt(pg, '.blk:has-text("Trưa")')
    await pg.click('[data-hb=read]'); assert await pg.get_attribute('[data-hb=read]', 'aria-pressed') == 'true'
    await pg.fill('#nNew', 'Ý tưởng hay'); await pg.press('#nNew', 'Enter'); await pg.click('[data-n2t]')
    await pg.click('[data-tab=tasks]'); assert await pg.locator('.tt:has-text("Ý tưởng hay")').count() == 1
    await pg.click('[data-tab=set]'); n = await pg.locator('.setrow2').count(); assert n >= 9
    for k in ['wardrobe', 'me', 'season', 'remind', 'data', 'demo', 'about', 'habits', 'water']:
        await pg.click(f'[data-sp={k}]'); assert await pg.locator('.backbtn').count() == 1; await pg.click('.backbtn')
    assert not pg.errs, pg.errs; await b.close()

@T('Theme theo mùa: Giáng sinh / Năm mới / Tết / bình thường')
async def t_season(p):
    for when, cls, pill in [((2026, 12, 10), 'xmas', 'Giáng sinh'), ((2026, 12, 31), 'ny', 'giao thừa'), ((2027, 1, 25), 'tet', 'Tết Đinh Mùi'), ((2027, 3, 1), '', '')]:
        b, ctx, pg = await page(p, datetime.datetime(*when, 10, 0, tzinfo=TZ))
        c = await pg.evaluate('document.documentElement.className')
        assert (cls in c.split()) if cls else not any(x in c.split() for x in ['xmas', 'ny', 'tet']), (when, c)
        assert pill in await txt(pg, '#xpill'), (when, await txt(pg, '#xpill'))
        assert not pg.errs, pg.errs; await b.close()

async def main():
    srv = subprocess.Popen([sys.executable, '-m', 'http.server', str(PORT), '-d', ROOT], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    time.sleep(1)
    try:
        only = sys.argv[1:]
        async with async_playwright() as p:
            for t in TESTS:
                if only and not any(o.lower() in t.__name__.lower() for o in only): continue
                await t(p)
    finally:
        srv.terminate()
    bad = [r for r in results if not r[1]]
    print(f'\n{len(results)-len(bad)}/{len(results)} bài thử đạt.')
    sys.exit(1 if bad else 0)

asyncio.run(main())

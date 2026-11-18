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
                import traceback; ln = traceback.extract_tb(e.__traceback__)[-1].lineno
                results.append((name, False, repr(e)[:300])); print(f'❌ {name} (dòng {ln}): {repr(e)[:2000]}')
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

@T('Tab Hôm nay gọn: nước trong Thói quen, việc không giờ trong Thời gian biểu, ẩn/sắp xếp thẻ')
async def t_cards(p):
    b, ctx, pg = await page(p, datetime.datetime(2026, 11, 18, 9, 0, tzinfo=TZ))
    assert await pg.locator('.card:has-text("🌱 Thói quen") .wblock .cup').count() == 8
    assert await pg.locator('.card h2:has-text("Việc đến hạn")').count() == 0
    await pg.click('[data-tab=tasks]'); await pg.fill('#tnew', 'Đóng tiền điện'); await pg.press('#tnew', 'Enter')
    await pg.click('.tmain:has-text("Đóng tiền điện")'); await pg.click('[data-tquick="0"]'); await pg.click('[data-tlv=none]'); await pg.click('[data-a=tSave]')
    await pg.click('[data-tab=today]')
    assert 'Đóng tiền điện' in await txt(pg, '.blk.pend')
    await pg.locator('.blk.pend input').first.click(); await pg.clock.run_for(300)
    assert await pg.locator('.blk.pend').count() == 0
    await pg.click('[data-spgo=todaycards]')
    await pg.click('[data-ctog=notes]')
    for _ in range(6): await pg.click('[data-cmove="habits:-1"]')
    await pg.click('[data-tab=today]')
    assert await pg.locator('#nNew').count() == 0
    order = await pg.evaluate("[...document.querySelectorAll('#view > .card h2')].map(h=>h.textContent.slice(0,14))")
    ih = [i for i, o in enumerate(order) if 'Thói quen' in o][0]; it = [i for i, o in enumerate(order) if '3 việc' in o][0]
    assert ih < it, order
    await pg.click('[data-tab=set]'); await pg.click('[data-sp=todaycards]'); await pg.click('[data-a=cReset]'); await pg.click('[data-tab=today]')
    assert await pg.locator('#nNew').count() == 1
    assert not pg.errs, pg.errs; await b.close()

@T('Ngày Lười Biếng: Chibi hỏi, ẩn việc không gấp, giãn cơ; vùng cơ đau')
async def t_lazy(p):
    b, ctx, pg = await page(p, datetime.datetime(2026, 11, 16, 9, 0, tzinfo=TZ))
    await pg.click('[data-tab=tasks]')
    for n in ['Việc gấp', 'Việc để sau']:
        await pg.fill('#tnew', n); await pg.press('#tnew', 'Enter')
    await pg.click('.tmain:has-text("Việc gấp")'); await pg.click('[data-tquick="0"]'); await pg.click('[data-a=tSave]')
    await pg.click('[data-tab=health]'); await pg.click('[data-htab=gym]')
    for d in ['1', '3', '5']: await pg.click(f'[data-gday="{d}"]')
    await pg.click('[data-tab=today]'); await pg.click('[data-a=checkin]'); await pg.click('[data-f=energy][data-v="2"]'); await pg.click('[data-a=saveCheckin]')
    await pg.clock.run_for(3000)
    assert 'nghỉ chút nha' in await txt(pg, '#nudge'), await txt(pg, '#nudge')
    await pg.click('[data-nudge=b0]'); await pg.clock.run_for(500)
    assert await pg.locator('.lazycard').count() == 1
    await pg.click('[data-tab=tasks]')
    assert await pg.locator('.tt:has-text("Việc để sau")').count() == 0 and await pg.locator('.tt:has-text("Việc gấp")').count() == 1
    await pg.click('[data-a=lazyAll]'); assert await pg.locator('.tt:has-text("Việc để sau")').count() == 1
    await pg.click('[data-tab=health]'); assert 'Giãn cơ 10 phút' in await txt(pg, '#view .card h2')
    await pg.click('[data-tab=today]'); await pg.click('[data-a=lazyOff]'); assert await pg.locator('.lazycard').count() == 0
    # vùng cơ đau
    await pg.click('[data-a=checkin]'); await pg.click('[data-f=energy][data-v="4"]'); await pg.click('[data-f=body][data-v=sore]')
    assert await pg.locator('#soreBox:not(.hide)').count() == 1
    await pg.click('[data-sore=chest]'); await pg.click('[data-a=saveCheckin]'); await pg.clock.run_for(500)
    await pg.click('[data-tab=health]')
    t = await txt(pg, '#view')
    assert 'Đang đau Ngực' in t and 'Đẩy ngực' not in await txt(pg, '.sglist'), t[:300]
    assert not pg.errs, pg.errs; await b.close()

@T('Giảm hiệu ứng: tắt tuyết/hoa giấy, Chibi ngồi yên')
async def t_lowfx(p):
    b, ctx, pg = await page(p, datetime.datetime(2026, 12, 10, 10, 0, tzinfo=TZ))
    assert await pg.evaluate("document.getElementById('snow').children.length") > 0
    await pg.click('[data-tab=set]'); await pg.click('[data-sp=me]'); await pg.click('[data-a=lowFx]'); await pg.clock.run_for(1000)
    assert 'calm' in await pg.evaluate('document.documentElement.className')
    assert await pg.evaluate("document.getElementById('snow').children.length") == 0
    x1 = await pg.evaluate("document.getElementById('pet').style.transform"); await pg.clock.run_for(15000)
    assert x1 == await pg.evaluate("document.getElementById('pet').style.transform")
    assert not pg.errs, pg.errs; await b.close()

@T('Người thương: hồ sơ, quà + ngân sách, .ics hằng năm, lịch hẹn vào Thời gian biểu')
async def t_people(p):
    from icalendar import Calendar
    b, ctx, pg = await page(p, datetime.datetime(2026, 11, 18, 9, 0, tzinfo=TZ))
    await pg.click('[data-tab=people]'); await pg.click('[data-p=addP]')
    await pg.fill('[data-pf=name]', 'Mẹ Hoa'); await pg.press('[data-pf=name]', 'Tab')
    await pg.click('[data-prel=mom]')
    await pg.fill('[data-pf=bday]', '1968-11-20'); await pg.press('[data-pf=bday]', 'Tab')
    assert 'tròn 58 tuổi, ngày kia' in await txt(pg, '#sheet')
    await pg.fill('#pWishNew', 'Khăn lụa'); await pg.press('#pWishNew', 'Enter')
    await pg.click('[data-pw2g]')
    await pg.fill('[data-pgp]', '500k'); await pg.press('[data-pgp]', 'Tab')
    assert await pg.input_value('[data-pgp]') == '500.000'
    await pg.fill('#pGiftNew', 'Hoa tulip'); await pg.fill('#pGiftPrice', '1tr2'); await pg.press('#pGiftPrice', 'Enter')
    await pg.fill('[data-pbud]', '1tr'); await pg.press('[data-pbud]', 'Tab')
    g = await txt(pg, '#pGifts'); assert '1.700.000đ' in g and 'vượt 700.000đ' in g, g
    await pg.locator('[data-pgst$=":wrapped"]').first.click()
    await pg.click('[data-p=addAnni]'); await pg.fill('[data-pan]', 'Ngày cưới'); await pg.press('[data-pan]', 'Tab')
    await pg.fill('[data-pad]', '1992-02-29'); await pg.press('[data-pad]', 'Tab')
    async with pg.expect_download() as d: await pg.click('[data-p^="bell:"]')
    f = os.path.join(OUT, 'p.ics'); await (await d.value).save_as(f)
    E = Calendar.from_ical(open(f, 'rb').read()).walk('VEVENT')
    assert len(E) == 2 and str(E[0].decoded('DTSTART')) == '2026-11-20' and E[0]['RRULE']['FREQ'] == ['YEARLY']
    assert sorted(str(a.decoded('TRIGGER')) for a in E[0].walk('VALARM')) == ['-3 days, 9:00:00', '9:00:00']
    assert E[1]['RRULE']['BYMONTHDAY'] == [-1] and 'Khăn lụa' in str(E[0]['DESCRIPTION'])
    await pg.click('[data-p^="back:"]'); assert '🔔' in await txt(pg, '#pRemind')
    await pg.click('[data-p=close]')
    up = await txt(pg, '#view'); assert 'Sinh nhật Mẹ Hoa (58 tuổi)' in up and 'ngày kia' in up and '🎁 2 quà' in up, up
    await pg.click('[data-p=addA]'); await pg.fill('#aTitle', 'Ăn tối'); await pg.fill('#aTime', '19:00')
    await pg.click('[data-awho]'); await pg.fill('#aPlace', 'Phở Thìn'); await pg.click('[data-alv=chibi]')
    assert await pg.locator('#aRemind [data-alead]').count() == 4
    await pg.click('[data-p=aSave]'); await pg.clock.run_for(400)
    await pg.click('[data-tab=today]')
    v = await txt(pg, '#view'); assert '🎂 Mẹ Hoa ngày kia' in v and '💌 1 lịch hẹn hôm nay' in v and '💌 Ăn tối' in v, v
    await pg.locator('.sitem:has-text("Ăn tối") input').click(); await pg.clock.run_for(400)
    await pg.click('[data-tab=people]'); assert 'gặp hôm nay' in await txt(pg, '.prow')
    await pg.clock.run_for(600); await pg.reload(); await pg.clock.run_for(1500); await pg.click('[data-tab=people]')
    v = await txt(pg, '#view'); assert 'Mẹ Hoa' in v and 'Lịch hẹn đã qua (1)' in v and 'Quà đang chuẩn bị' in v, v
    await pg.click('[data-p=addP]'); await pg.click('#sheetbg', position={'x': 10, 'y': 10})
    assert await pg.locator('.prow').count() == 1
    assert not pg.errs, pg.errs; await b.close()

@T('Người thương: nâng cấp dữ liệu cũ, Chibi mũ tiệc ngày sinh nhật, nhắc lâu chưa gặp')
async def t_people2(p):
    b = await p.chromium.launch(executable_path=CHROME, args=['--no-sandbox'])
    ctx = await b.new_context(viewport={'width': 390, 'height': 844}, service_workers='block', timezone_id='Asia/Ho_Chi_Minh')
    pg = await ctx.new_page(); pg.errs = []; pg.on('pageerror', lambda e: pg.errs.append(str(e)))
    await pg.clock.install(time=datetime.datetime(2026, 11, 18, 10, 0, tzinfo=TZ))
    await pg.goto(URL + 'README.md')
    await pg.evaluate("""() => new Promise((res, rej) => { const r = indexedDB.open('cozy-life-os', 3);
      r.onupgradeneeded = () => ['settings','days','sleeps','snapshots','tasks','workouts'].forEach(n => r.result.createObjectStore(n));
      r.onsuccess = () => { const db = r.result, tx = db.transaction(['settings','tasks'], 'readwrite');
        tx.objectStore('settings').put({ name: 'Lan', v2: true }, 'main');
        tx.objectStore('tasks').put({ id: 't1', title: 'Việc cũ', group: 'work', createdAt: '2026-11-01T00:00:00Z' }, 't1');
        tx.oncomplete = () => { db.close(); res(); }; }; r.onerror = rej; })""")
    await pg.goto(URL); await pg.clock.run_for(1500)
    assert 'Lan' in await txt(pg, '#hello')
    await pg.click('[data-tab=tasks]'); assert 'Việc cũ' in await txt(pg, '#view')
    await pg.click('[data-tab=people]'); await pg.click('[data-p=addP]')
    await pg.fill('[data-pf=name]', 'Bé Na'); await pg.press('[data-pf=name]', 'Tab')
    await pg.fill('[data-pf=bday]', '2000-11-18'); await pg.press('[data-pf=bday]', 'Tab')
    await pg.fill('[data-pf=lastMet]', '2026-09-01'); await pg.press('[data-pf=lastMet]', 'Tab')
    await pg.click('[data-p=close]')
    assert await pg.locator('#pet svg [fill="#7FC8F8"]').count() >= 1
    assert 'Lâu rồi chưa gặp' in await txt(pg, '.prow')
    await pg.clock.run_for(36000)
    assert 'sinh nhật' in await txt(pg, '#nudge.show'); await pg.click('[data-nudge=b1]')
    await pg.clock.run_for(36000)
    assert 'chưa gặp' in await txt(pg, '#nudge.show'); await pg.click('[data-nudge=b0]'); await pg.clock.run_for(400)
    assert 'gặp hôm nay' in await txt(pg, '.prow')
    await pg.clock.run_for(600); await pg.reload(); await pg.clock.run_for(1500)
    await pg.click('[data-tab=people]'); assert 'Bé Na' in await txt(pg, '#view')
    assert not pg.errs, pg.errs; await b.close()

@T('Ngủ trưa: Chibi rủ, đếm ngược, chuông gọi dậy, ghi lại, mở lại app giữa giấc')
async def t_nap(p):
    b, ctx, pg = await page(p, datetime.datetime(2026, 11, 18, 12, 20, tzinfo=TZ))
    assert 'Ngủ trưa' in await txt(pg, '.napcard')
    assert '☀️ Ngủ trưa' in await txt(pg, '#view')
    await pg.clock.fast_forward(5 * 60000); await pg.clock.run_for(36000)
    assert 'Đến giờ ngủ trưa' in await txt(pg, '#nudge.show'); await pg.click('[data-nudge=b0]'); await pg.clock.run_for(1200)
    assert await pg.locator('#napcover.on').count() == 1
    assert (await txt(pg, '#napLeft')).startswith('19:') or (await txt(pg, '#napLeft')).startswith('20:')
    await pg.clock.fast_forward(20 * 60000); await pg.clock.run_for(2000)
    assert await pg.locator('#napcover.waking').count() == 1
    await pg.click('#napcover [data-nap=wake]')
    assert 'Đã ngủ trưa' in await txt(pg, '#sheet'); await pg.click('[data-napfeel=groggy]')
    assert 'Đã ngủ trưa' in await txt(pg, '.napcard') and '😵‍💫 Lừ đừ' in await txt(pg, '.napcard')
    assert await pg.locator('.sitem.done:has-text("Ngủ trưa")').count() == 1
    await pg.click('[data-tab=health]'); await pg.click('[data-htab=sleep]')
    v = await txt(pg, '#view'); assert 'Ngủ trưa' in v and 'Lần' in v, v
    await pg.click('[data-nap=sheet]'); await pg.click('[data-napl="90"]')
    assert 'trọn một chu kỳ' in await txt(pg, '#napHint')
    await pg.click('[data-nap=go]'); await pg.clock.run_for(600 + 10 * 60000)
    await pg.reload(); await pg.clock.run_for(1500)
    assert await pg.locator('#napcover.on').count() == 1 and (await txt(pg, '#napLeft')).startswith('7')
    await pg.click('#napcover [data-nap=wake]'); await pg.click('[data-napfeel=fresh]')
    await pg.click('[data-tab=health]'); await pg.click('[data-htab=sleep]')
    assert '2' in await txt(pg, '.stat3')
    assert not pg.errs, pg.errs; await b.close()

@T('Check-in công việc: bắt đầu, nghỉ, vươn vai, kết thúc, thống kê tuần, ca bù, quên kết thúc')
async def t_work(p):
    b, ctx, pg = await page(p, datetime.datetime(2026, 11, 18, 8, 0, tzinfo=TZ))
    assert 'Bắt đầu làm việc' in await txt(pg, '.workcard')
    await pg.click('[data-work=start]'); await pg.clock.run_for(500)
    assert 'Đang làm việc' in await txt(pg, '.workcard')
    await pg.clock.fast_forward(61 * 60000); await pg.clock.run_for(36000)
    assert 'vươn vai' in await txt(pg, '#nudge.show'); await pg.click('[data-nudge=b0]')
    await pg.click('[data-work=brk]'); assert 'Đang nghỉ' in await txt(pg, '.workcard')
    await pg.clock.fast_forward(30 * 60000); await pg.click('[data-work=brk]')
    await pg.clock.fast_forward(90 * 60000); await pg.clock.run_for(16000)
    assert (await txt(pg, '#workLive')).startswith('2g3'), await txt(pg, '#workLive')
    await pg.click('[data-work=end]'); await pg.clock.run_for(500)
    v = await txt(pg, '#view'); assert '💼 Đã làm 2g3' in v and '2g3' in await txt(pg, '.workcard'), v
    await pg.click('.workcard [data-work=stats]')
    sh = await txt(pg, '#sheet'); assert 'Tuần này' in sh and '2,5g' in sh, sh
    await pg.click('[data-wkday="2026-11-17"]')
    await pg.fill('#wkNs', '09:00'); await pg.fill('#wkNe', '18:00'); await pg.fill('#wkNb', '60'); await pg.click('[data-wkadd]')
    assert 'Tổng: 8g' in await txt(pg, '#sheet')
    await pg.fill('[data-wke]', '17:30'); await pg.press('[data-wke]', 'Tab')
    assert 'Tổng: 7g30' in await txt(pg, '#sheet')
    await pg.click('#sheet [data-work=stats]'); assert '10g' in await txt(pg, '.stat3') or '10,' in await txt(pg, '.stat3')
    await pg.click('[data-wkweek="-1"]'); assert 'Tuần trước' in await txt(pg, '#sheet')
    await pg.keyboard.press('Escape')
    await pg.click('[data-work=start]'); await pg.clock.run_for(500)
    await pg.clock.fast_forward(15 * 3600000); await pg.clock.run_for(61000)
    if 'Quên bấm' not in await txt(pg, '#sheet'): await pg.keyboard.press('Escape'); await pg.clock.run_for(61000)
    assert 'Quên bấm kết thúc' in await txt(pg, '#sheet')
    await pg.fill('#wkForgot', '18:00'); await pg.click('[data-work=forgot]'); await pg.clock.run_for(500)
    await pg.clock.run_for(600); await pg.reload(); await pg.clock.run_for(1500)
    if await pg.locator('#sheetbg.show, #sheetbg.on').count(): await pg.keyboard.press('Escape')
    await pg.locator('.workcard [data-work=stats]').click(); await pg.click('[data-wkday="2026-11-18"]')
    t = await txt(pg, '#sheet'); assert await pg.locator('[data-wks]').count() == 2 and ('Tổng: 8g5' in t or 'Tổng: 9g' in t), t
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

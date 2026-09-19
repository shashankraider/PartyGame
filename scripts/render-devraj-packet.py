"""Render the authored Devraj evidence packet. Uses reportlab; no external images."""
from pathlib import Path
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor, Color
from reportlab.lib.pagesizes import A4
from reportlab.platypus import Paragraph
from reportlab.lib.styles import ParagraphStyle
from reportlab.pdfbase.pdfmetrics import stringWidth

OUT=Path('output/pdf/Devraj_Second_Interview_Evidence.pdf')
OUT.parent.mkdir(parents=True,exist_ok=True)
W,H=A4
INK=HexColor('#172d3c'); TEAL=HexColor('#276b73'); PAPER=HexColor('#f6f2e8'); MUTED=HexColor('#56656c'); RED=HexColor('#994939'); LINE=HexColor('#d1d6cf')
c=canvas.Canvas(str(OUT),pagesize=A4)
c.setTitle('Murder in Mussoorie - Devraj second interview evidence')
c.setAuthor('PartyGame - fictional case documents')
def text(x,y,s,size=10,font='Helvetica',color=INK):
 c.setFillColor(color);c.setFont(font,size);c.drawString(x,y,s)
def para(x,y,s,width=491,size=10,color=INK):
 p=Paragraph(s,ParagraphStyle('p',fontName='Helvetica',fontSize=size,leading=size*1.45,textColor=color))
 _,h=p.wrap(width,800);p.drawOn(c,x,y-h);return y-h

def box(x,y,w,h,fill=PAPER,stroke=LINE):
 c.setFillColor(fill);c.setStrokeColor(stroke);c.setLineWidth(.7);c.roundRect(x,y,w,h,6,fill=1,stroke=1)
def rule(y):c.setStrokeColor(LINE);c.line(46,y,W-46,y)
def page(num,kind,title,sub):
 c.setFillColor(PAPER);c.rect(0,0,W,H,fill=1,stroke=0)
 c.setFillColor(INK);c.rect(0,H-136,W,136,fill=1,stroke=0)
 text(46,H-39,'CBI  /  MUSSOORIE CASE FILE',10,'Helvetica-Bold',HexColor('#abc8c5'))
 text(46,H-69,title,25,'Helvetica-Bold',PAPER)
 text(46,H-94,sub,10,'Helvetica',PAPER)
 text(46,H-118,kind.upper(),8,'Courier',HexColor('#abc8c5'))
 rule(46);text(46,30,'MURDER IN MUSSOORIE  /  FICTIONAL GAME EXHIBIT',7,'Courier',MUTED)
 text(W-94,30,f'{num:02d} / 05',8,'Courier',MUTED)

def callout(y,title,body):
 box(46,y-90,W-92,90,HexColor('#e8efea'))
 text(60,y-21,title.upper(),9,'Helvetica-Bold',TEAL)
 para(60,y-34,body,W-120,9)
def row(y,label,value):
 text(59,y,label.upper(),8,'Helvetica-Bold',MUTED);para(235,y+3,value,295,10);rule(y-20)
def finish():c.showPage()

page(1,'Investigation request / retain with the case file','Recall dossier','Inspector Devraj Khanna  /  CBI investigator request sheet')
text(46,668,'FIRST INTERVIEW',11,'Helvetica-Bold',TEAL)
para(46,648,'Question Devraj, note his account, and request independent checks. A request is not a result. Keep the findings below sealed until his next interview.',size=11)
items=[('01','Telecom records','Obtain the Bisht-Devraj call record: time, numbers and duration.'),('02','Handset location examination','Extract retained location history around the fatal bend and record its accuracy.'),('03','Duty-register audit','Obtain the original entry, later revision and independent editor attribution.'),('04','Issued-lathi examination','Identify and seize the issued weapon; examine blood/DNA and injury compatibility.')]
y=570
for n,title,body in items:
 box(46,y-83,W-92,76,HexColor('#fffdf7'))
 c.setStrokeColor(TEAL);c.rect(60,y-34,13,13,fill=0,stroke=1)
 text(86,y-27,n+'  '+title,12,'Helvetica-Bold');para(86,y-41,body,W-150,9)
 y-=91
text(46,178,'SECOND INTERVIEW',11,'Helvetica-Bold',TEAL)
para(46,158,'Recall Devraj after the requested reports return. Present each exhibit separately. Ask him to explain the findings, then confront the combined sequence. Do not read unrequested results into the interview.',size=10)
text(46,77,'Requested by: ____________________     Interview: ______     Date: __________',8,'Courier',MUTED)
finish()

page(2,'Telecom record / bisht-devraj-call','A call. Not its contents.','Phone records  /  Bisht to Devraj  /  Murder night')
text(46,665,'RECORDED CONTACT',10,'Helvetica-Bold',TEAL)
box(46,482,503,155,HexColor('#fffdf7'))
text(64,606,'RAJVEER BISHT',13,'Helvetica-Bold');text(64,586,'Personal mobile',10,color=MUTED)
text(349,606,'DEVRAJ KHANNA',13,'Helvetica-Bold');text(349,586,'Personal mobile',10,color=MUTED)
c.setStrokeColor(TEAL);c.setLineWidth(2);c.line(80,550,510,550);c.line(500,557,510,550);c.line(500,543,510,550)
text(183,520,'8:00 PM  /  47 SECONDS',15,'Courier-Bold',TEAL)
row(446,'Source','Telecom records obtained by the CBI.')
row(400,'Connection','Personal number to personal number; neither is a landline.')
row(343,'Time correlation','The call starts with the Royal Pines CCTV maintenance gap.')
callout(270,'What this establishes','Contact between the two personal numbers at the recorded time, with a duration of 47 seconds.')
callout(165,'Limit of the record','No recording or transcript is supplied. This exhibit does not establish what Bisht said, an instruction to kill, or where Devraj was standing.')
finish()

page(3,'Device examination / devraj-phone-location','The handset near the bend','Recovered location history  /  Device and SIM linked to Devraj')
text(46,665,'TWO FIXES DURING THE INCIDENT WINDOW',10,'Helvetica-Bold',TEAL)
box(46,408,503,232,HexColor('#fffdf7'))
c.setStrokeColor(LINE);c.setLineWidth(1)
for x in range(64,545,30):c.line(x,434,x,614)
for y in range(434,620,30):c.line(64,y,531,y)
c.setStrokeColor(INK);c.setLineWidth(6)
p=c.beginPath();p.moveTo(75,458);p.curveTo(170,467,205,587,305,556);p.curveTo(365,520,400,477,520,488);c.drawPath(p)
c.setLineWidth(1);c.setStrokeColor(TEAL);c.setDash(4,3)
for x,y in [(291,555),(311,541)]:c.circle(x,y,49,stroke=1,fill=0)
c.setDash();c.setFillColor(TEAL)
for x,y in [(291,555),(311,541)]:c.circle(x,y,4,stroke=0,fill=1)
text(81,597,'Camel\'s Back Road',10,'Helvetica-Bold');text(327,580,'Bend / broken railing',9,'Helvetica-Bold')
text(83,421,'SCHEMATIC ONLY - NOT A GEOGRAPHIC MAP OR MEASURED ROUTE',7,'Courier',MUTED)
row(376,'Fix 01','8:18 PM - near the bend; recorded horizontal accuracy 20 m.')
row(321,'Fix 02','8:21 PM - near the bend; recorded horizontal accuracy 20 m.')
para(46,267,'Source: retained handset location history, recovered through a documented forensic extraction after seizure. These fixes do not come from the 47-second call or a broad cell-tower sector.',size=10)
callout(183,'Interpret within its limits','The accuracy areas include the bend. They do not establish an exact standing position, who carried the phone, contact with Vikram or an assault. No call audio was recovered.')
finish()

page(4,'Document examination / devraj-duty-log','The entry was replaced','Duty register  /  Original, revision and independent attribution')
text(46,665,'PRESERVED IN THE DISTRICT AUDIT COPY',10,'Helvetica-Bold',TEAL)
box(46,483,503,153,HexColor('#fffdf7'))
text(64,611,'ORIGINAL  /  8:05 PM',11,'Courier-Bold',TEAL)
para(64,587,'Inspector Devraj Khanna - left station on round.',460,16)
text(64,517,'Departure recorded. Route not independently verified.',9,color=MUTED)
box(46,298,503,163,HexColor('#f6e9df'))
text(64,435,'REPLACEMENT  /  EDITED AT 8:34 PM',11,'Courier-Bold',RED)
para(64,410,'8:00-8:30 PM - Inspector Devraj Khanna present at station throughout; no departure.',460,16)
text(64,324,'Both versions survive in an append-only district audit.',9,color=MUTED)
text(46,268,'WHO MADE THE EDIT?',10,'Helvetica-Bold',TEAL)
para(46,247,'The edit uses Devraj\'s authenticated account. Station desk CCTV corroborates him making the revision at the terminal after returning. Attribution does not rely on a username alone.',size=10)
callout(174,'What the audit does - and does not - establish','It documents his deliberate alteration of the whereabouts record. It does not by itself establish why he changed it, prove murder or reveal the words of Bisht\'s call.')
finish()

page(5,'Laboratory examination / devraj-lathi-forensics','An identified service lathi','DK-17  /  Issue record, recovery record and laboratory findings')
text(46,665,'WEAPON ASSOCIATION + BIOLOGICAL FINDING',10,'Helvetica-Bold',TEAL)
box(46,407,503,231,HexColor('#fffdf7'))
c.setStrokeColor(INK);c.setLineWidth(17);c.line(108,449,108,592)
c.setStrokeColor(TEAL);c.setLineWidth(2)
for y in range(561,594,6):c.line(96,y,120,y)
text(80,425,'DK-17',10,'Courier-Bold')
text(159,602,'ISSUED TO DEVRAJ',11,'Helvetica-Bold',TEAL)
para(159,584,'The equipment issue record identifies this marked lathi.',363,10)
text(159,541,'RECOVERED AND SEALED',11,'Helvetica-Bold',TEAL)
para(159,523,'Seized from his locked station equipment cabinet; sealing, transfers and laboratory receipt documented.',363,10)
text(159,466,'BLOOD / DNA',11,'Helvetica-Bold',RED)
para(159,448,'Blood from the striking end yields a single-source DNA profile matching Vikram Singh.',363,10)
text(46,375,'INJURY COMPARISON',10,'Helvetica-Bold',TEAL)
para(46,354,'The pre-fall head injury is consistent with the lathi\'s dimensions and cylindrical shape. It is not a unique impression identifying this weapon to the exclusion of every other weapon.',size=11)
text(46,275,'LABORATORY CONTROLS',10,'Helvetica-Bold',TEAL)
para(46,254,'The report records satisfactory controls and no indication of contamination in those controls.',size=10)
callout(187,'Interpret within its limits','The finding connects Vikram\'s biological material to this recovered lathi. It does not date the deposit, identify who wielded it, establish how the material transferred or show a push.')
finish();c.save();print(OUT)

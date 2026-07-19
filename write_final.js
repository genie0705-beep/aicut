const { chromium } = require('playwright');
const fs = require('fs');

const TITLE = '피부과 영상 마케팅, 숏폼 편집 하나로 해결되는 이유 | 여름 시즌 준비';

const SECTIONS = [
  // 섹션 1
  {type:'h2', text:"☀️ 요즘 병원 마케팅, '숏폼'이 전부다"},
  {type:'p', text:'"원장님, 인스타그램 하세요?"'},
  {type:'p', text:'요즘 병원·의원에 가면 꼭 듣는 질문입니다.'},
  {type:'p', text:'환자들이 병원을 고를 때'},
  {type:'p', text:'인스타그램이나 유튜브 숏폼을 먼저 본다고 해요.'},
  {type:'p', text:'실제로 릴스·쇼츠에 병원 소개 영상을 올리면'},
  {type:'p', text:'일반 텍스트보다 문의율이 3배 이상 높습니다.'},
  {type:'p', text:'하지만 문제는 영상 찍고 편집하는 게 너무 어렵다는 거예요.'},
  {type:'p', text:'간호사님한테 폰으로 찍어달라 하기도 애매하고,'},
  {type:'p', text:'의료광고 규제 때문에 뭐라도 잘못 나갈까 겁나고요.'},
  {type:'p', text:'그래서 준비했습니다.'},
  {type:'p', text:'피부과·치과·한의원·성형외과에서'},
  {type:'p', text:'바로 써먹을 수 있는 영상 마케팅 전략을 알려드릴게요.'},
  {type:'br'},
  // 섹션 2
  {type:'h2', text:"📋 직접 찍고 직접 편집하면 생기는 일"},
  {type:'p', text:'많은 병원 원장님들이 영상 마케팅을 시작했다가'},
  {type:'p', text:'금방 포기하는 이유, 알고 계신가요?'},
  {type:'p', text:'첫째, 촬영 시간이 너무 낭비됩니다.'},
  {type:'p', text:'원장님이 직접 영상을 찍으려면'},
  {type:'p', text:'진료 시간 내야 하고, 스크립트도 짜야 합니다.'},
  {type:'p', text:'둘째, 편집 프로그램이 너무 어렵습니다.'},
  {type:'p', text:'프리미어 프로나 파이널 컷을'},
  {type:'p', text:'배우려면 최소 3개월은 걸려요.'},
  {type:'p', text:'셋째, 의료광고 규제를 다 외우기 어렵습니다.'},
  {type:'p', text:'식약처 심의 기준, 네이버 정책까지 고려하면'},
  {type:'p', text:'영상 하나 올리기도 부담스럽습니다.'},
  {type:'p', text:'이런 고민, 저희가 다 해결해드립니다.'},
  {type:'br'},
  // 섹션 3 - 이미지 후
  {type:'h2', text:"✅ 의료광고 규제, 전문 에디터가 체크합니다"},
  {type:'p', text:'"의료광고, 영상 올려도 돼요?"'},
  {type:'p', text:'네, 가능합니다.'},
  {type:'p', text:'단, 몇 가지 규정을 꼭 지켜야 해요.'},
  {type:'p', text:'체험담·효과를 과장하지 않을 것'},
  {type:'p', text:"'확실한 효과'처럼 단정적 표현 금지"},
  {type:'p', text:'치료 전·후 사진은 진실하게 표시'},
  {type:'p', text:'의료법·약사법·식품위생법 준수 내용만'},
  {type:'p', text:'처음엔 하나하나 신경 쓰이는 게 정상입니다.'},
  {type:'p', text:'하지만 경험이 많은 편집 에디터가 있으면'},
  {type:'p', text:'이런 규제를 완벽하게 지키면서도'},
  {type:'p', text:'마케팅 효과는 극대화할 수 있어요.'},
  {type:'p', text:'에이컷은 병원 영상 편집 전문 에디터가'},
  {type:'p', text:'의료광고 규제를 모두 숙지하고 작업합니다.'},
  {type:'br'},
  // 섹션 4
  {type:'h2', text:"🎯 여름 시즌, 피부과·의원 마케팅 전략"},
  {type:'p', text:'7월 중순, 무더위가 절정인 지금.'},
  {type:'p', text:'피부과·의원에 딱 맞는 여름 시즌 콘텐츠를 소개합니다.'},
  {type:'p', text:'✔️ 선크림·자외선 차단 영상'},
  {type:'p', text:'여름 필수 아이템, 병원에서 추천하면 신뢰도 UP'},
  {type:'p', text:'✔️ 다이어트·체형 관리 시즌 영상'},
  {type:'p', text:'여름 휴가 전 관리법, 환자 공감 얻기 좋음'},
  {type:'p', text:'✔️ 원장님 브랜딩 숏폼'},
  {type:'p', text:'신뢰감 있는 전문가 이미지, 숏폼으로 각인'},
  {type:'p', text:'✔️ 시술 소개 60초 요약'},
  {type:'p', text:'궁금증을 해소하는 숏폼, 예약 전환율 UP'},
  {type:'p', text:'이런 영상들을 매주 2~3개씩 꾸준히 올리면'},
  {type:'p', text:'3개월 후에는 병원 인스타그램이'},
  {type:'p', text:'지역 내에서 가장 믿음직한 채널로 자리잡습니다.'},
  {type:'br'},
  // 섹션 5
  {type:'h2', text:"📸 병원에 딱 맞는 영상, 어떻게 만드나요?"},
  {type:'p', text:'에이컷의 병원 영상 작업 프로세스를 소개합니다.'},
  {type:'p', text:'STEP 1: 원장님·실장님께서 촬영 영상 전송'},
  {type:'p', text:'핸드폰으로 3~5분만 찍어 보내주세요.'},
  {type:'p', text:'대본도 콘티도 필요 없습니다.'},
  {type:'p', text:'STEP 2: 에이컷 에디터가 1~2일 내 편집 완료'},
  {type:'p', text:'숏폼 2~3개, 혹은 일반 영상 1개로 맞춤 편집'},
  {type:'p', text:'의료광고 규제 체크까지 완벽하게!'},
  {type:'p', text:'STEP 3: 검토 후 수정 요청 (무제한)'},
  {type:'p', text:'마음에 들 때까지 수정 가능합니다.'},
  {type:'p', text:'STEP 4: 완료된 영상 다운로드 후 게시'},
  {type:'p', text:'원장님은 그냥 올리기만 하면 끝!'},
  {type:'p', text:'복잡한 편집 프로그램, 이제 안녕입니다.'},
  {type:'br'},
  // 섹션 6
  {type:'h2', text:"🔥 하반기 마케팅, 준비된 병원이 이깁니다"},
  {type:'p', text:'벌써 7월입니다.'},
  {type:'p', text:'하반기 병원 마케팅 전략, 세워두셨나요?'},
  {type:'p', text:'상반기에는 블로그나 인스타로'},
  {type:'p', text:'텍스트 위주 마케팅을 했다면,'},
  {type:'p', text:'하반기에는 영상 마케팅을 추가해보세요.'},
  {type:'p', text:'영상 하나가 환자의 마음을 움직입니다.'},
  {type:'p', text:'직접 찍고, 전문가가 편집하는'},
  {type:'p', text:'가장 효율적인 병원 마케팅, 지금 시작하세요.'},
  {type:'p', text:'문의는 아래 연락처로 편하게 주세요!'},
  {type:'br'},
  // CTA
  {type:'p', text:'📞 카카오톡 상담: https://pf.kakao.com/_GIesX/chat'},
  {type:'p', text:'📧 이메일: master@aicut.co.kr'},
  {type:'p', text:'🌐 홈페이지: https://aicut.co.kr'},
  {type:'br'},
  // 해시태그
  {type:'p', text:'#병원영상편집 #의료마케팅 #피부과마케팅 #숏폼마케팅 #영상편집외주 #병원마케팅 #의료광고 #원장님마케팅 #인스타마케팅 #영상마케팅 #에이컷 #영상편집 #숏폼편집 #릴스마케팅 #여름마케팅 #하반기마케팅 #병원SNS #의료숏폼 #치과마케팅 #한의원마케팅 #성형외과마케팅 #병원인스타 #의료영상 #전문가편집 #마케팅전략 #지역마케팅 #무더위 #피부관리 #여름피부 #의료콘텐츠'},
];

async function main() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  const pages = ctx.pages();
  
  // index 2의 탭 (기존 write 탭) 닫고 새로 열기
  const oldWrite = pages[2];
  await oldWrite.close();
  console.log('❌ 기존 탭 닫음');
  
  // dialog 핸들러
  b.on('dialog', async d => { await d.accept(); });

  // 새 탭 열기
  const write = await ctx.newPage();
  await write.goto('https://blog.naver.com/aicut?Redirect=Write&', { waitUntil: 'networkidle', timeout: 20000 });
  console.log('🔄 새 에디터 로딩 중...');

  // iframe 대기
  for (let i = 0; i < 20; i++) {
    const fe = await write.$('#mainFrame');
    if (fe) {
      const f = await fe.contentFrame();
      if (f) {
        try {
          const ok = await f.evaluate(() => typeof SmartEditor?._editors?.['blogpc001'] !== 'undefined');
          if (ok) {
            console.log('✅ SmartEditor 로드 완료!');
            
            // 1. 제목 설정
            await f.evaluate((t) => {
              SmartEditor._editors['blogpc001'].setDocumentTitle(t);
            }, TITLE);
            console.log('✅ 1. 제목 설정 완료');

            // 2. 본문을 블록으로 설정 (키보드 입력 시뮬레이션 대신 blocks API 사용)
            await f.evaluate((blocks) => {
              const ed = SmartEditor._editors['blogpc001'];
              const data = ed.getDocumentData();
              data.document.blocks = [];
              data.document.removedImages = [];
              // blocks 생성
              const newBlocks = blocks.map(b => {
                if (b.type === 'br') return { type: 'paragraph', text: '', style: { textAlign: 'center' } };
                if (b.type === 'h2') return { type: 'heading2', text: b.text, style: { textAlign: 'center' } };
                return { type: 'paragraph', text: b.text, style: { textAlign: 'center' } };
              });
              data.document.blocks = newBlocks;
              ed.setDocumentData(data);
              
              // 강제로 canvas 내용 업데이트
              const canvas = document.querySelector('.se-canvas');
              if (canvas) {
                // innerHTML 갱신 트리거
                canvas.style.display = 'none';
                setTimeout(() => { canvas.style.display = ''; }, 50);
              }
            }, SECTIONS);
            console.log('✅ 2. 본문 설정 완료 (', SECTIONS.length, '블록)');
            await f.waitForTimeout(2000);

            // 3. 이미지 업로드
            const IMG_DIR = 'C:\\Users\\paul\\.openclaw\\workspace\\';
            for (const imgFile of [
              'aicut_blog_hospital_main.png',
              'aicut_blog_hospital_01.png',
              'aicut_blog_hospital_02.png',
              'aicut_blog_hospital_03.png',
              'aicut_blog_hospital_cta.png',
            ]) {
              const imgPath = IMG_DIR + imgFile;
              console.log(`\n📸 ${imgFile}`);
              
              // 팝업 정리
              await f.evaluate(() => {
                document.querySelectorAll('.se-popup-dim').forEach(el => el.remove());
                document.querySelectorAll('.se-popup').forEach(el => el.remove());
              });
              
              // 사진 버튼 클릭
              await f.evaluate(() => {
                const btn = document.querySelector('.se-image-toolbar-button');
                if (btn) btn.click();
              });
              await f.waitForTimeout(1500);
              
              // file input 설정
              const fi = await f.$('input[type="file"]');
              if (fi) {
                await fi.setInputFiles(imgPath);
                console.log('  ✅ 업로드 시작, 대기중...');
                await f.waitForTimeout(8000);
              } else {
                console.log('  ❌ file input 못 찾음');
              }
            }

            // 4. 이미지 정렬 센터로
            await f.evaluate(() => {
              const ed = SmartEditor._editors['blogpc001'];
              const data = ed.getDocumentData();
              data.document.blocks.forEach(b => {
                if (b.type === 'image') b.align = 'center';
              });
              ed.setDocumentData(data);
            });
            console.log('\n✅ 3. 이미지 정렬 완료');
            
            // 5. 저장
            const sBtn = await f.$('button:has-text("저장"), span:has-text("저장")');
            if (sBtn) { await sBtn.click(); console.log('✅ 4. 저장 버튼 클릭'); }
            await f.waitForTimeout(3000);
            
            // 6. 최종 확인
            const final = await f.evaluate(() => {
              const ed = SmartEditor._editors['blogpc001'];
              const data = ed.getDocumentData();
              const blocks = data.document.blocks;
              const counts = {};
              blocks.forEach(b => { counts[b.type] = (counts[b.type]||0)+1; });
              return { title: ed.getDocumentTitle(), total: blocks.length, counts };
            });
            console.log('\n✅ 최종 상태:', JSON.stringify(final, null, 2));
            
            console.log('\n🎉 블로그 작성 완료! (임시저장)');
            console.log('정이사님, 검토 후 "발행해"라고 말씀해주세요!');
            
            process.exit(0);
          }
        } catch(e) { /* retry */ }
      }
    }
    await write.waitForTimeout(1500);
  }
  
  console.log('❌ 로드 실패');
  process.exit(1);
}

main().catch(e => { console.error('❌', e.message); process.exit(1); });

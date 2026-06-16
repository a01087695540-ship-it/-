# Google Apps Script 연동 가이드 및 코드

본 파일은 **AX 부스터 과정 사전 설문조사** 애플리케이션의 데이터를 **Google Spreadsheet(구글 스프레드시트)**와 실시간으로 연동하기 위한 Google Apps Script 코드 및 가이드입니다.

---

## 1. Google Apps Script 복사용 코드

아래 코드를 모두 복사하여 Google Apps Script 편집기에 붙여넣으십시오.

```javascript
/**
 * AX 부스터 과정 사전 설문조사 - Google Spreadsheet 실시간 연동 스크립트
 * 
 * 기능: 설문조사 웹앱으로부터 데이터를 실시간 POST 수신하여
 * 지정된 스프레드시트의 첫 번째 시트에 자동 기입합니다.
 */

function doPost(e) {
  try {
    // 1. 전송 수신 데이터 검증 및 JSON 파싱
    if (!e || !e.postData || !e.postData.contents) {
      throw new Error("전송된 데이터가 비어 있습니다. (No payload found)");
    }
    
    var jsonString = e.postData.contents;
    var data = JSON.parse(jsonString);
    
    // 2. 스프레드시트 선택 (오류 방지를 위해 '활성 시트' 우선 시도 후 실패 시 고유 ID 시도)
    var sheet;
    try {
      var activeSpreadsheet = SpreadsheetApp.getActiveSpreadsheet();
      if (activeSpreadsheet) {
        sheet = activeSpreadsheet.getSheets()[0];
      }
    } catch (activeErr) {
      // 활성 슬라이드를 가져오지 못한 경우 무시하고 ID 조회를 시도합니다.
    }
    
    if (!sheet) {
      var spreadsheetId = "17B9qQHaAmTSekuT0Xibcu92JeErr7dDUj3qMlZ7R2DA";
      sheet = SpreadsheetApp.openById(spreadsheetId).getSheets()[0];
    }
    
    // 3. 스프레드시트가 완전히 비어있는 신규 문서라면 헤더 테이블 행 자동 생성
    if (sheet.getLastRow() === 0) {
      var headers = [
        "제출 시각", 
        "이름", 
        "AI 툴 (Q2)", 
        "AI 사용 빈도 (Q3)", 
        "AI 활용 분야 (Q4)", 
        "AI 활용 수준 (Q5)", 
        "담당 업무 (Q6)", 
        "자동화 희망 작업 (Q7)", 
        "소요 시간 (Q8)", 
        "자동화 상세 내용 (Q9)", 
        "교육 기대사항 (Q10)", 
        "자유 의견 (Q11)"
      ];
      sheet.appendRow(headers);
      
      // 가독성을 위한 헤더 행 고정 및 폰트 볼드 처리 지정
      var headerRange = sheet.getRange(1, 1, 1, headers.length);
      headerRange.setFontWeight("bold");
      headerRange.setBackground("#F3F4F6"); // 깔끔한 회색 음영
      headerRange.setHorizontalAlignment("center");
      sheet.setFrozenRows(1);
    }
    
    // 4. 설문 데이터 안전 추출 및 배열화
    var rowData = [
      data["제출시각"] || new Date().toLocaleString("ko-KR"),
      data["이름"] || "",
      data["AI툴"] || "",
      data["AI사용빈도"] || "",
      data["AI활용분야"] || "",
      data["AI활용수준"] || "",
      data["담당업무"] || "",
      data["자동화희망작업"] || "",
      data["소요시간"] || "",
      data["자동화상세"] || "",
      data["교육기대사항"] || "",
      data["자유의견"] || ""
    ];
    
    // 5. 시트 최하단에 행 추가 기입
    sheet.appendRow(rowData);
    
    // 정상 성공 응답 반환 (CORS는 구글 앱스 스크립트 엔진이 내부적으로 리다이렉션을 통해 우회하므로 addHeader 없이 plain 반환합니다.)
    return ContentService.createTextOutput(JSON.stringify({ "status": "success" }))
                         .setMimeType(ContentService.MimeType.JSON);
                         
  } catch (error) {
    // 에러 발생 로그 작성 및 오류 응답 반환
    Logger.log("Error during submission: " + error.toString());
    return ContentService.createTextOutput(JSON.stringify({ "status": "error", "message": error.toString() }))
                         .setMimeType(ContentService.MimeType.JSON);
  }
}
```

---

## 2. 구글 스프레드시트 연동 방법 (초간단 5단계)

### 1단계: 스프레드시트 생성
1. [Google 스프레드시트](https://docs.google.com/spreadsheets)에 접속하여 새 스프레드시트를 생성합니다.
2. 스프레드시트의 이름을 원하는 형식(예: `Lotte GRS AX Booster 사전설문 결과`)으로 지정합니다.

### 2단계: 앱스 스크립트(Apps Script) 편집기 열기
1. 상단 메뉴바에서 **[확장 프로그램] ➔ [Apps Script]**를 클릭합니다.
2. 기존에 작성된 `Function myFunction() { ... }` 코드를 전부 **삭제**합니다.
3. 위의 **1번 코드 상자** 전체를 복사하여 에디터 창에 붙여넣고, 상단의 **저장 디스크 아이콘(Ctrl + S / Cmd + S)**을 누릅니다.

### 3단계: 웹앱으로 배포하기 (매우 중요 ⭐)
설문조사 웹 서비스가 이 시트에 데이터를 쓸 수 있도록 허용하기 위해 "웹앱" 형태로 공개 배포를 해야 합니다.
1. 우측 상단의 **[배포] ➔ [새 배포]** 단추를 누릅니다.
2. 유형 선택 톱니바퀴를 눌러 **[웹앱]**을 선택합니다.
3. 배포 설정을 아래 요건과 일치하게 설정합니다.
   * **설명**: `AX 설문 데이터 연동`
   * **웹앱 실행 대상 (Execute as)**: `나 (사용자 본인의 구글 이메일)`
   * **액세스 권한이 있는 사용자 (Who has access)**: **`모든 사용자 (Anyone)`** ➔ *이 부분을 "모든 사용자"로 설정해야만 외부 설문양식 브라우저에서 시트로 데이터를 전송할 수 있습니다.*
4. **[배포]** 버튼을 클릭합니다.
5. 중간에 "액세스 승인(Authorize Access)" 팝업 창이 뜨면 구글 계정을 승인하고, **[고급] ➔ [Go to 제목없는 프로젝트 (안전하지 않음)] ➔ [허용]**을 순서대로 진행해 줍니다.

### 4단계: 생성된 웹앱 URL 복사
* 배포가 완료되면 화면에 **웹앱 URL** 주소가 나타납니다. `https://script.google.com/macros/s/.../exec` 형태를 띱니다.
* 이 URL 주소를 안전하게 복사해 둡니다.

### 5단계: 웹 소스코드에 URL 붙여넣기
1. 작성하신 리액트 웹 소스코드 내 `/src/App.tsx` 파일의 맨 위를 열어봅니다.
2. 아래와 같이 명시된 상수 부분에 복사해 온 URL을 넣어주고 저장하면 완벽히 작동합니다!

```typescript
// /src/App.tsx 파일의 약 25번째 줄
const SCRIPT_URL = "여기에_구글_스크립트_배포_URL_붙여넣기";
```

이제 설문조사를 작성하고 **[설문 제출하기]** 버튼을 누르시면, 방금 생성하신 구글 스프레드시트 파일에 첫 행에 헤더가 자동 정렬되며 무제한 실시간 입력됩니다! 🚀

---

## 3. 🚨 데이터가 전송되지 않는 경우의 자가진단 (트러블슈팅)

데이터가 스프레드시트에 기입되지 않는다면 높은 확률로 아래 3가지 원인 중 하나입니다. 차례대로 확인해 보세요:

### ① Google Apps Script 배포 설정 오류 (가장 빈번)
* **문제 상황**: 웹앱 권한 설정을 잘못하여 로그인 권한이 없는 비인증 사용자의 API 요청이 차단되는 현상입니다.
* **해결 방법**: 
  1. Apps Script 창 우측 상단의 **[배포]** -> **[배포 관리]**를 누릅니다.
  2. 현재 활성화되어 있는 버전을 찾은 다음 우측 상단의 **편집(연필 모양)**을 누릅니다.
  3. **액세스 권한이 있는 사용자(Who has access)** 항목이 반드시 **모든 사용자(Anyone)**로 되어 있는지 확인하십시오. (⚠️ "나만" 또는 "구글 본인만"으로 선택된 경우 외부 연동이 완벽하게 거부됩니다.)
  4. 설정을 바꾸었다면 반드시 버전을 **[새 버전]**으로 지정하여 **[배포]**를 완료하고, 변경된 최신 주소를 웹 소스코드에 다시 붙여넣어 주십시오.

### ② 앱스 스크립트 실행 로그 확인하기 (에러 원인 추적의 정석 💡)
* **어떻게 확인하나요?**
  1. 구글 앱스 스크립트 에디터 좌측 메뉴의 **[실행수정 / Executions (시간표 모양 아이콘)]**을 클릭합니다.
  2. 트리거된 `doPost` 로그 목록들이 보일 것입니다.
  3. 목록 중 **실패(Failed / 빨간색 느낌표)** 된 내역이 있는지 보고, 클릭해서 상세 로그를 살펴보십시오.
  4. 만약 `Exception: 스프레드시트를 열 수 없습니다.` 와 같은 에러가 발견되면, 스프레드시트 고유 ID 번호(`17B9qQHaAmTSekuT0Xibcu92JeErr7dDUj3qMlZ7R2DA`)가 올바른지 혹은 해당 스프레드시트에 로그인한 구글 계정이 소유/편집 권한이 있는지 점검하십시오.

### ③ 구글 앱스 스크립트 버전 관리 누락
* **중요한 특징**: 구글 앱스 스크립트는 코드를 열심히 바꾼 뒤 단순히 저장 디스크 버튼(`Ctrl + S`)을 눌렀다고 해서 바로 외부 웹 서버와 연동되는 것이 아닙니다. **반드시 배포를 '새 버전'으로 다시 퍼블리시 해 주어야만 최종 코드 변경 사항이 활성화됩니다.**
* 코드를 수정한 뒤에는 항상 **[배포] ➔ [새 배포]** 또는 **[배포 관리] ➔ [편집] ➔ [새 버전]**을 골라 변경 사항을 라이브 웹에 퍼블리시하십시오.


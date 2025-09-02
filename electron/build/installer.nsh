!include "MUI2.nsh"
!include "nsDialogs.nsh"

Var ApiKey
Var ComplaintsPath
Var ApiKeyControl
Var ComplaintsControl

Page custom GetInputs
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_LANGUAGE "Turkish"

Function GetInputs
    nsDialogs::Create 1018
    Pop $0

    ${NSD_CreateLabel} 0 0 100% 12u "OpenAI API Key"
    Pop $1
    ${NSD_CreateText} 0 12u 100% 12u ""
    Pop $ApiKeyControl

    ${NSD_CreateLabel} 0 30u 100% 12u "Müşteri Şikayetleri Excel Yolu"
    Pop $2
    ${NSD_CreateText} 0 42u 75% 12u ""
    Pop $ComplaintsControl
    ${NSD_CreateBrowseButton} 80% 42u 20% 12u "Seç"
    Pop $3
    ${NSD_OnClick} $3 SelectComplaints

    nsDialogs::Show
FunctionEnd

Function SelectComplaints
    nsDialogs::SelectFileDialog open "" "" "" $ComplaintsControl
FunctionEnd

Function .onInstSuccess
    nsDialogs::GetText $ApiKeyControl $ApiKey
    nsDialogs::GetText $ComplaintsControl $ComplaintsPath
    StrCpy $0 "$APPDATA\DB-App"
    CreateDirectory $0
    FileOpen $1 "$0\.env" w
    FileWrite $1 "OPENAI_API_KEY=$ApiKey$\r$\n"
    FileWrite $1 "COMPLAINTS_XLSX_PATH=$ComplaintsPath$\r$\n"
    FileWrite $1 "GUIDELINES_DIR=$APPDATA\\DB-App\\guidelines$\r$\n"
    FileWrite $1 "PROMPTS_DIR=$APPDATA\\DB-App\\prompts$\r$\n"
    FileClose $1
FunctionEnd


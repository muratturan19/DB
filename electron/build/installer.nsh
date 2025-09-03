!include "MUI2.nsh"
!include "nsDialogs.nsh"
!include "FileFunc.nsh"

Var ApiKeyControl
Var ComplaintsControl

!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_DIRECTORY
Page custom InputPageCreate InputPageLeave
!insertmacro MUI_PAGE_INSTFILES

Function InputPageCreate
  nsDialogs::Create 1018
  Pop $0

  ${NSD_CreateLabel} 0 0 100% 12u "OpenAI API Key:"
  Pop $1
  ${NSD_CreateText} 0 12u 100% 12u ""
  Pop $ApiKeyControl

  ${NSD_CreateLabel} 0 36u 100% 12u "Müşteri Şikayetleri Excel dosyası:"
  Pop $1
  ${NSD_CreateText} 0 48u 75% 12u ""
  Pop $ComplaintsControl
  ${NSD_CreateBrowseButton} 80% 48u 20% 12u "Gözat..."
  Pop $2
  ${NSD_OnClick} $2 SelectComplaints

  nsDialogs::Show
FunctionEnd

Function SelectComplaints
  nsDialogs::SelectFileDialog open "" "Excel Files|*.xlsx;*.xls|All Files|*.*"
  Pop $0
  StrCmp $0 "" done
  ${NSD_SetText} $ComplaintsControl $0
done:
FunctionEnd

Function InputPageLeave
  ${NSD_GetText} $ApiKeyControl      $R0
  ${NSD_GetText} $ComplaintsControl  $R1

  StrLen $R2 $R0
  IntCmp $R2 10 0 invalid_api 0
  IfFileExists "$R1" 0 invalid_xlsx

  StrCpy $R3 "$APPDATA\DB-App"
  CreateDirectory "$R3"
  FileOpen  $R4 "$R3\.env" w
  FileWrite $R4 "OPENAI_API_KEY=$R0$\r$\n"
  FileWrite $R4 "COMPLAINTS_XLSX_PATH=$R1$\r$\n"
  FileWrite $R4 "GUIDELINES_DIR=$R3\guidelines$\r$\n"
  FileWrite $R4 "PROMPTS_DIR=$R3\prompts$\r$\n"
  FileClose $R4
  Return

invalid_api:
  MessageBox MB_ICONEXCLAMATION "Geçersiz OpenAI API Key."
  Abort

invalid_xlsx:
  MessageBox MB_ICONEXCLAMATION "Geçersiz Excel yolu (.xlsx/.xls seçin)."
  Abort
FunctionEnd


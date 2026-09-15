; Inno Setup Script para Lumcards (Windows)
; Compilar con Inno Setup 6 (iscc.exe) para generar Lumcards_Setup.exe

#define MyAppName "Lumcards"
#define MyAppVersion "1.0.0"
#define MyAppPublisher "Lumcards Team"
#define MyAppURL "http://127.0.0.1:8765"
#define MyAppExeName "Lumcards.exe"

[Setup]
AppId={{D814FA79-7C65-4981-81FE-B93710A88241}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
AppPublisherURL={#MyAppURL}
AppSupportURL={#MyAppURL}
AppUpdatesURL={#MyAppURL}
DefaultDirName={localappdata}\Programs\Lumcards
DisableProgramGroupPage=yes
LicenseFile=README.md
PrivilegesRequired=lowest
OutputDir=dist-installer
OutputBaseFilename=Lumcards_Setup
SetupIconFile=assets\icon.ico
Compression=lzma2/max
SolidCompression=yes
WizardStyle=modern
; WebView2Loader.dll del paquete es x64.
ArchitecturesAllowed=x64compatible
ArchitecturesInstallIn64BitMode=x64compatible
CloseApplications=yes

[Languages]
Name: "spanish"; MessagesFile: "compiler:Languages\Spanish.isl"

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"

[Files]
; Lista explicita: NUNCA empaquetar data, copias, registros ni perfiles WebView2.
; No agregar reglas de borrado para data: una actualizacion conserva la biblioteca.
Source: "Lumcards.exe"; DestDir: "{app}"; Flags: ignoreversion
Source: "Lumcards.exe.config"; DestDir: "{app}"; Flags: ignoreversion skipifsourcedoesntexist
Source: "Cerrar Lumcards.exe"; DestDir: "{app}"; Flags: ignoreversion
Source: "Microsoft.Web.WebView2.Core.dll"; DestDir: "{app}"; Flags: ignoreversion
Source: "Microsoft.Web.WebView2.WinForms.dll"; DestDir: "{app}"; Flags: ignoreversion
Source: "WebView2Loader.dll"; DestDir: "{app}"; Flags: ignoreversion
Source: "server.py"; DestDir: "{app}"; Flags: ignoreversion
Source: "engine.py"; DestDir: "{app}"; Flags: ignoreversion
Source: "native_image_occlusion.py"; DestDir: "{app}"; Flags: ignoreversion
Source: "text_import.py"; DestDir: "{app}"; Flags: ignoreversion
Source: "clean_anki_importer.py"; DestDir: "{app}"; Flags: ignoreversion
Source: "practice_store.py"; DestDir: "{app}"; Flags: ignoreversion
Source: "requirements*.txt"; DestDir: "{app}"; Flags: ignoreversion
Source: "README.md"; DestDir: "{app}"; Flags: ignoreversion
Source: "IDEAS.md"; DestDir: "{app}"; Flags: ignoreversion
Source: "IMAGE_OCCLUSION_SOURCES.md"; DestDir: "{app}"; Flags: ignoreversion
Source: "COMMERCIAL_ROADMAP.md"; DestDir: "{app}"; Flags: ignoreversion
Source: "start.ps1"; DestDir: "{app}"; Flags: ignoreversion
Source: "stop.ps1"; DestDir: "{app}"; Flags: ignoreversion
Source: "INICIAR LUMCARDS.cmd"; DestDir: "{app}"; Flags: ignoreversion
Source: "CERRAR LUMCARDS.cmd"; DestDir: "{app}"; Flags: ignoreversion
; Fuentes y SDK fijado para poder recompilar el host instalado.
; No copiar tools completo: contiene pruebas y copias privadas de desarrollo.
Source: "tools\launcher.cs"; DestDir: "{app}\tools"; Flags: ignoreversion
Source: "tools\installer_gui.cs"; DestDir: "{app}\tools"; Flags: ignoreversion
Source: "tools\close_launcher.cs"; DestDir: "{app}\tools"; Flags: ignoreversion
Source: "tools\build-desktop.ps1"; DestDir: "{app}\tools"; Flags: ignoreversion
Source: "tools\desktop.manifest"; DestDir: "{app}\tools"; Flags: ignoreversion
Source: "tools\vendor\webview2\LICENSE.txt"; DestDir: "{app}\tools\vendor\webview2"; Flags: ignoreversion
Source: "tools\vendor\webview2\version.json"; DestDir: "{app}\tools\vendor\webview2"; Flags: ignoreversion
Source: "tools\vendor\webview2\Microsoft.Web.WebView2.Core.dll"; DestDir: "{app}\tools\vendor\webview2"; Flags: ignoreversion
Source: "tools\vendor\webview2\Microsoft.Web.WebView2.WinForms.dll"; DestDir: "{app}\tools\vendor\webview2"; Flags: ignoreversion
Source: "tools\vendor\webview2\WebView2Loader.dll"; DestDir: "{app}\tools\vendor\webview2"; Flags: ignoreversion
Source: "assets\*"; DestDir: "{app}\assets"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "dist\*"; DestDir: "{app}\dist"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: ".venv\*"; DestDir: "{app}\.venv"; Flags: ignoreversion recursesubdirs createallsubdirs; Excludes: "__pycache__,*.pyc"

[Icons]
Name: "{autoprograms}\Lumcards\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; WorkingDir: "{app}"; IconFilename: "{app}\assets\icon.ico"
Name: "{autoprograms}\Lumcards\Cerrar Lumcards"; Filename: "{app}\Cerrar Lumcards.exe"; WorkingDir: "{app}"; IconFilename: "{app}\assets\icon.ico"
Name: "{autodesktop}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; WorkingDir: "{app}"; IconFilename: "{app}\assets\icon.ico"; Tasks: desktopicon

[Run]
Filename: "{app}\{#MyAppExeName}"; WorkingDir: "{app}"; Description: "{cm:LaunchProgram,{#StringChange(MyAppName, '&', '&&')}}"; Flags: postinstall skipifsilent nowait

[UninstallRun]
Filename: "{app}\Cerrar Lumcards.exe"; WorkingDir: "{app}"; Flags: runhidden waituntilterminated

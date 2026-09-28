' ==============================================================================
' GreenLife AI - Silent Desktop Launcher Wrapper
' Runs Launch-GreenLife.bat completely silently with zero black CMD terminal window
' ==============================================================================
Set WshShell = CreateObject("WScript.Shell")
Set FSO = CreateObject("Scripting.FileSystemObject")
ScriptDir = FSO.GetParentFolderName(WScript.ScriptFullName)
BatPath = Chr(34) & ScriptDir & "\Launch-GreenLife.bat" & Chr(34)

' Window style 0 = Hidden (Completely silent)
WshShell.Run BatPath, 0, False
Set WshShell = Nothing
Set FSO = Nothing

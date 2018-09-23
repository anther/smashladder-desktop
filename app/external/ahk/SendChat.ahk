#NoEnv  ; Recommended for performance and compatibility with future AutoHotkey releases.
#Warn
#NoTrayIcon
SendMode Input
SetWorkingDir %A_ScriptDir%  ; Ensures a consistent starting directory.
#SingleInstance force
#WinActivateForce
DetectHiddenWindows, on
SetTitleMatchMode, 1
SetKeyDelay, -1

#include functions.ahk

chatMessage := false
Loop, %0%  ; For each parameter:
{
    param := %A_Index%  ; Fetch the contents of the variable whose name is contained in A_Index.
    if (A_Index == 1)
    {
        chatMessage := param
    }
}
if(chatMessage)
{
    SendChatMessage(chatMessage)
}

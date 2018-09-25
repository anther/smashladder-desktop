#NoEnv  ; Recommended for performance and compatibility with future AutoHotkey releases.
#Warn
#NoTrayIcon
#Persistent
SendMode Input
SetWorkingDir %A_ScriptDir%  ; Ensures a consistent starting directory.
#SingleInstance force
#WinActivateForce
DetectHiddenWindows, on
CoordMode, Pixel, Relative
SetTitleMatchMode, 1
SetKeyDelay, -1

currentDolphinWindow =
hostCodeIsNew := false
lastHostCode := ""

parameter =
secondaryParameter =
thirdParameter =
fourthParameter =


SetTimer, PlayerListCheck, 10000
SetTimer, HostCodeCheck, 10000

Loop, %0%  ; For each parameter:
{
    param := %A_Index%  ; Fetch the contents of the variable whose name is contained in A_Index.
    if (A_Index == 1)
    {
        parameter := param
    }
    if (A_Index == 2)
    {
        secondaryParameter := param
    }
    if (A_Index == 3)
    {
        thirdParameter := param
    }
    if (A_Index == 4)
    {
        fourthParameter := param
    }
    if (A_Index == 5)
    {
        fifthParameter := param
    }
}

if (parameter == "host")
{
    joinGameUsername := secondaryParameter
    hostGameString := thirdParameter
    hostGameName := fourthParameter
    buildName := fifthParameter

	WinGet, active_id, ID, A

	result := FetchDolphin(buildName)
    if(!result)
        return
	result := NavigateToSetupNetplay()
    if(!result)
        return
	result := SetupNetplayHost(joinGameUsername, hostGameString, hostGameName)
    if(!result)
        return
	result := GetAndSendHostCode(joinGameUsername)
    if(!result)
        return

	if (false && active_id != 0x3f1112)
		WinActivate, ahk_id %active_id% ;Returns users to whichever Window they were in

}
else if (parameter == "join")
{
    joinGameUsername := secondaryParameter
    loadedCode := thirdParameter
    buildName := fourthParameter

    if(!loadedCode)
    {
        SendToParent("input_error", "no_code")
        return
    }

	foundDolphin := FetchDolphin(buildName)
	if(!foundDolphin)
	{
	    return
	}

	NavigateToSetupNetplay()
	JoinNetplayLobby(joinGameUsername, loadedCode)
}
else if (parameter == "launch")
{

    WinWait , Dolphin NetPlay, Chat , 2
    netplayChat := WinExist()  ; lock target handle to last found window

    ;WinActivate , ahk_id %netplayChat%

    ControlFocus, Start, ahk_id %netplayChat%
    ControlSend, Start, {enter}, ahk_id %netplayChat%

    if(ErrorLevel == 1)
    {
        SendToParent("start_game_error", "Could not find start button")
        return
    }
    SendToParent("start_game_success", "Tapped Start Button")
}
else if (parameter == "open")
{

    buildName := secondaryParameter
    foundDolphin := FetchDolphin(buildName)
	if(!foundDolphin)
	{
	    return
	}
	SendToParent("launch_success", "Found Dolphin")
}


~^up::
    changeBufferDirection("up")
return

~^down::
    changeBufferDirection("down")
return

PlayerListCheck:
    SendToParent("player_list_loop", "success")
    GetPlayerList()
return

HostCodeCheck:
    global hostCodeIsNew
    retrievedHostCode := retrieveHostCode()
    if(retrievedHostCode && hostCodeIsNew)
    {
        ;AppendTextToNetplayLobbyChat( "--- Sending Replacement Host Code (" . retrievedHostCode . ") to SmashLadder ---")
        SendToParent("host_code", retrievedHostCode)
    }
return

#include functions.ahk
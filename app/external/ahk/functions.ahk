#Include json.ahk

SetBuffer(value){
    netplayLobbyWindow := FindNetplayWindow()
    ControlFocus, Edit3, ahk_id %netplayLobbyWindow%
    ControlSend, Edit3, ahk_id %netplayLobbyWindow%
}

ChangeBufferDirection(direction){
    netplayLobbyWindow := FindNetplayWindow()
    ControlSend, Edit4 , {%direction%}, ahk_id %netplayLobbyWindow%
    if(direction != "up" || ErrorLevel == 1)
    {
        ControlSend, Edit3 , {%direction%}, ahk_id %netplayLobbyWindow%
    }
}

FetchDolphin(buildName){
    global currentDolphinWindow
    dolphins := Array("Faster Melee", "Ishiiruka-Dolphin", "Dolphin 4.0-7840", "Dolphin 5.0-321", buildName)

    attempts := 100

    while (attempts > 0)
    {
        For index, value in dolphins
        {
            currentDolphinWindow := WinExist(value)
            if(currentDolphinWindow)
            {
                SendToParent("fetch_found", value)
                WinWaitActive , ahk_id %currentDolphinWindow%, , 2
                Sleep 1
                if WaitForGamesToBeLoaded()
                {
                    WinSetTitle , %buildName% - SmashLadder
                    return true
                }
                else
                {
                    if !WinExist( "ahk_id" currentDolphinWindow)
                    {
                        sleep 250
                        SendToParent("launch_visible", "bring_to_focus")
                        ;WinActivate
                    }
                }
            }
            else
            {
                SendToParent("fetch_not_found", value " attempts:" attempts "remaining")
            }
        }
        attempts--
        sleep 150
    }
    MsgBox, , Error, No Dolphin Found
    return false
}

WaitForGamesToBeLoaded(){
    global currentDolphinWindow
    attempts := 1
    success := false

    while( attempts > 0 )
    {
        SendToParent("verity_game", "attempt")
        ControlGet, rowsInGameList, List,Count , SysListView321, ahk_id %currentDolphinWindow%
        SendToParent("rows_in_game_list", rowsInGameList)
        if (rowsInGameList != 0)
        {
            SendToParent("row_status", "found")
            attempts := 0
            success := true

            break
        }
        else
        {
            SendToParent("row_status", "none")

        }
        sleep 150
        attempts--
    }

    if(success)
    {
        SendToParent("verity_game", "success")
        return true
    }
    else
    {
        SendToParent("verity_game", "fail")
        return false
    }
}

SendToParent(action, message := false){
    data := {action: action, message: message}

    output := JSON.dump(data)
    FileAppend, %output%`r`n, *
    return true
}

NavigateToActiveDolphinMainWindow(){
    global currentDolphinWindow
    ;WinActivate, ahk_id %currentDolphinWindow% , , 2

    IfWinExist, ahk_id %currentDolphinWindow%
    {
        SendToParent("navigate_main", "success")
        return true
    }
    else
    {
        SendToParent("navigate_main", "fail")
        return false
    }
    if( ErrorLevel == 1)
    {

    }
}

NavigateToSetupNetplay(){
	global currentDolphinWindow

    attempts := 50
    while (attempts > 0)
    {
        SendToParent("navigate_setup", "attempt")

        if !NavigateToActiveDolphinMainWindow()
        {
            SendToParent("Navigation Error Could not find window - attempts remaining %attempts%")
            attempts--
            sleep 250
            continue
        }

        SendToParent("navigate_setup", "success")

        clickedStartNetplay := false
        menuItemNames := Array("Start Netplay", "Start Netplay...")

        For index, menuItemName in menuItemNames
        {
            try{
                WinMenuSelectItem, ahk_id %currentDolphinWindow%, , Tools, %menuItemName%

                clickedStartNetplay := true
                break
            }
            catch e
            {
                SendToParent("find_netplay_menu_fail", menuItemName " "  e.message)
            }
        }
        if(!clickedStartNetplay)
        {
            SendToParent("find_netplay_menu_fail_complete", "1")
            MsgBox, , Not like the others, Could not open the netplay window
            return false
        }

        if( FindNetplaySetupWindow() )
        {
            return true
        }
        sleep 1
    }
    SendToParent("navigate_setup", "fail")
    return false
}

retrieveHostCode(){
    global hostCodeIsNew
    global lastHostCode

    netplayLobbyWindow := FindNetplayWindow()
	if(!netplayLobbyWindow)
	{
        SendToParent("no_netplay_lobby_window", "fail")
	    return false
	}
	roomId = ""
    ControlGetText, roomId, Static1, ahk_id %netplayLobbyWindow%

    if(roomId == "")
    {
        SendToParent("super_invalid_room_id", "attempt_to_find_netplay_window_again")
    }
    SendToParent("roomIdIs", roomId)

    if(roomId ~= "[0-9a-f]{8}")
    {
        if(lastHostCode != roomId)
        {
            hostCodeIsNew := true
        }
        lastHostCode := roomId


        return roomId
    }
    return false
}

retrieveHostCodeWithAttempts(attempts){
    while(attempts > 0)
    {
        hostCode := retrieveHostCode()
        if(hostCode)
        {
            return hostCode
        }
        sleep 100
        attempts--
    }
    return false
}

GetAndSendHostCode(joinGameUsername){
    netplayLobbyWindow := FindNetplayWindow()
    if(!netplayLobbyWindow)
    {
        SendToParent("no_netplay_lobby_window", "GetAndSendHostCode")
        return false
    }
	AppendTextToNetplayLobbyChat( "--- SmashLadder Stats Tracker Hooked ---")
    AppendTextToNetplayLobbyChat( "--- Logged into SmashLadder as " . joinGameUsername . " ---")
    AppendTextToNetplayLobbyChat( "--- Waiting for Host Code ---")

	hostCode := retrieveHostCodeWithAttempts(50)

	if(!hostCode)
	{
	    return false
	}

    if(joinGameUsername)
    {
        AppendTextToNetplayLobbyChat( "--- Sending Host Code (" . hostCode . ") to SmashLadder ---")
    }

    SendToParent("host_code", "" hostCode "")
    GetPlayerList()

    return true
}

AppendTextToNetplayLobbyChat(text){
    netplayLobbyWindow := FindNetplayWindow()
    if(!netplayLobbyWindow)
    {
        return false
    }
    chatTextBox := "Edit1"
    AppendText( text, chatTextBox, netplayLobbyWindow)
    return true
}

AppendText(text, editControl, ahkId){
    ControlGetText, previousText, %editControl%, ahk_id %ahkId%
    previousText := previousText  . text . "`r`n"
    ControlSetText, %editControl%, %previousText% , ahk_id %ahkId%
}

GetPlayerList(){
    netplayLobbyWindow := FindNetplayWindow()
    if(!netplayLobbyWindow)
    {
        SendToParent("player_list_check_fail", "No Lobby Window Found")
        return false
    }

    playerListInfo = ""
    ControlGet, items, List, , ListBox1, ahk_id %netplayLobbyWindow%

    playerListInfo := items
    SendToParent("player_list_info" , playerListInfo)
}

FindNetplayWindow(){
    sleep 2
    SendToParent("finding_netplay_window")

    dolphins := Array("Dolphin NetPlay", "Dolphin Netplay - SmashLadder")

    try{
        WinWait , Dolphin NetPlay, , 5, Setup
        netplayLobbyWindow := WinExist()
        WinSetTitle , Dolphin NetPlay - SmashLadder
        SendToParent("netplay_window_found", "!!!")
        return netplayLobbyWindow
    }catch e{
        SendToParent("netplay_window_not_found ", e.message)
        return false
    }
}

FindNetplaySetupWindow(joinGameUsername = ""){
    WinWait , Dolphin NetPlay Setup, , 2
    if(ErrorLevel)
    {
        return false
    }

    setupWindowId := WinExist()  ; lock target handle to last found window

    return %setupWindowId%
}

SetupNetplayHost(joinGameUsername, gameString, gameName){
	setupWindowId := FindNetplaySetupWindow(joinGameUsername)
        if(!setupWindowId)
            return false

    ControlGet, items, List, , ListBox1, ahk_id %setupWindowId%

    foundInList :=
    foundInListIndex :=
    total := 0
    Loop, Parse, items, `n
    {
        total++
        ifInString, A_LoopField, %gameString%
        {
            foundInList := A_LoopField
            foundInListIndex := A_Index - 1
        }
    }


    if(foundInList)
    {
        ;ControlClick , ListBox1, %gameString%, ahk_id %setupWindowId%
        Control, ChooseString, %gameString%, ListBox1, ahk_id %setupWindowId%
    }
    else
    {
        if(gameString)
        {
            SendToParent("setup_netplay_host_failed", "Game Not Found!, A listing for " gameName " was not found in the game list! (Game Identifier: " gameString ")")
            return false
        }
        else
        {
            SendToParent("setup_netplay_host_failed_empty_list", "Game was not found, And there are no games in this dolphin's game list")
            return false
        }
    }


    buttonName := FindButtonWithText("Host", setupWindowId)
    SendToParent("searching_for_host_button", "1")
    if(buttonName)
    {
        SendToParent("found_host_button", "Attempting to click " buttonName)
        try{
            ;WinWaitActive, ahk_id %setupWindowId%
            ControlFocus, %buttonName%, ahk_id %setupWindowId%
            ControlSend, %buttonName%, {enter}, ahk_id %setupWindowId%
            SendToParent("click success", buttonName)
            return true
        }catch e{
            SendToParent("click failed", buttonName " "  e.message)
        }
    }
    else
    {
        SendToParent("never_found_host_button", "1")
    }
    return false
}

FindButtonWithText(text, windowId){
    buttons := Array("Button1", "Button2", "Button3", "Button4", "Button5", "Button6")
    For index, buttonName in buttons
    {
        ControlGetText, buttonText, %buttonName%, ahk_id %windowId%
        if(buttonText == text)
        {
            return buttonName
        }
    }
    return false
}

JoinNetplayLobby(joinGameUsername, loadedCode){
	setupWindowId := FindNetplaySetupWindow(joinGameUsername)
    if (!setupWindowId)
        return false

	;WinActivate, ahk_id %setupWindowId%
	connectButton := FindButtonWithText("Connect", setupWindowId)
	ControlSetText, edit3, %loadedCode%, ahk_id %setupWindowId%
	ControlFocus, %connectButton%, ahk_id %setupWindowId%
	ControlSend, %connectButton%, {enter}, ahk_id %setupWindowId%

	if(ErrorLevel == 1)
    {
        SendToParent("lobby_join", "fail")
    }
    else
    {
         SendToParent("lobby_join", "success")
    }
    return
}

SendChatMessage(message){

    return
    netplayLobbyWindow := FindNetplayWindow()
    buttonName := FindButtonWithText("Send", netplayLobbyWindow)

    ControlSetText, Edit2, %message%, ahk_id %netplayLobbyWindow%
    ;ControlFocus, Button3, ahk_id %netplayLobbyWindow%
    ;ControlSend, Button3, {enter}, ahk_id %netplayLobbyWindow%
    sleep 1
    ControlClick, %buttonName%, ahk_id %netplayLobbyWindow%,,,, NA
}
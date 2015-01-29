  var nokiaScreen = target == "atmega328";
  screen_driver.setAttribute("type", "text/javascript");
  screen_driver.setAttribute("src", nokiaScreen ? "js/nokia_spi_driver.js": "js/tft_spi_driver.js");
  layout.appendChild(screen_driver);
  screen_buffer.width = nokiaScreen ? 84: 160;
  screen_buffer.height = nokiaScreen ? 48: 128;
  var scale = width/screen_buffer.width;

  function reportMhz(mhz)
  {
    document.getElementById("mhz").value = mhz.toString();
  }

  function reportCallFrame(frame)
  {
        var callframe = document.createElement("li");
        callframe.appendChild(document.createTextNode(frame));
        callstack.appendChild(callframe);
  }

  function normalize(value, align)
  {
    var normal_value = Math.floor(value);
    return normal_value % align === 0 ? normal_value: normal_value - (normal_value % align);
  }

  function initScreen()
  {
      screen_canvas.width = width;
      screen_canvas.height = scale*screen_buffer.height;
      return screen_canvas.height;
  }

  function initPort(port_id, port_height)
  {
      var pin = document.getElementById(port_id);
      pin.width = normalize(width/port_width, port_width)-1;
      var device_width = (pin.width*port_width) + port_width;
      if(device_width < width)
      {
          pin.width += normalize((width-device_width)/port_width, 2);
      }
      pin.height = port_height;
      fillCanvas(pin, default_color);
  }

  function initLastPin(port_id, port_height)
  {
     initPort(port_id, port_height);
     var pin = document.getElementById(port_id);
     var device_width = (pin.width*port_width)+port_width;
     pin.width += width-device_width;
  }

  function initPorts(port_height)
  {
     initPort("B0",port_height);
     initPort("B1",port_height);
     initPort("B2",port_height);
     initPort("B3",port_height);
     initPort("B4",port_height);
     initPort("B5",port_height);
     initPort("B6",port_height);
     initLastPin("B7",port_height);

     initPort("C0",port_height);
     initPort("C1",port_height);
     initPort("C2",port_height);
     initPort("C3",port_height);
     initPort("C4",port_height);
     initPort("C5",port_height);
     initPort("C6",port_height);
     initLastPin("C7",port_height);

     initPort("D0",port_height);
     initPort("D1",port_height);
     initPort("D2",port_height);
     initPort("D3",port_height);
     initPort("D4",port_height);
     initPort("D5",port_height);
     initPort("D6",port_height);
     initLastPin("D7",port_height);

     initPort("E0",port_height);
     initPort("E1",port_height);
     initPort("E2",port_height);
     initPort("E3",port_height);
     initPort("E4",port_height);
     initPort("E5",port_height);
     initPort("E6",port_height);
     initLastPin("E7",port_height);

     initPort("F0",port_height);
     initPort("F1",port_height);
     initPort("F2",port_height);
     initPort("F3",port_height);
     initPort("F4",port_height);
     initPort("F5",port_height);
     initPort("F6",port_height);
     initLastPin("F7",port_height);
  }

  function initFileInput()
  {
      var useDropbox = (typeof Dropbox != "undefined");
      if(useDropbox){
          var options =
          {
            success: function(files) {
                var url = files[0].link;
                var client = new XMLHttpRequest();
                client.open("GET", url, true);
                client.setRequestHeader("Content-Type", "text/plain");
                client.onreadystatechange = function()
                {
                    if(client.readyState==4 && client.status==200)
                    {
                      loadMemory(client.responseText);
                      engineInit();
                      isPaused = true;
                      exec();
                    }
                }
                client.send();
            },
            linkType: "direct",
            extensions: ['.hex'],
         };
        file_input.style.display = "none";
        sources.appendChild(Dropbox.createChooseButton(options));
      }
      else
      {
          file_input.addEventListener('change', function(evt)
          {
            var file = file_input.files[0];
            if(!file)
            {
              alert('Intel Hex File Required');
              return;
            }
            var reader = new FileReader();
            reader.onloadend = function(evt)
            {
              if(evt.target.readyState == FileReader.DONE)
              {
                var bytes = evt.target.result;
                if( bytes.charCodeAt(0) == 0x7f && bytes[1] == 'E' && bytes[2] == 'L' && bytes[3] == 'F' )
                {
                  intelhex = getHexFromElf(bytes);
                  buildFrameInfo();
                  buildLineInfo();
                }else{
                  intelhex = evt.target.result;
                }
                loadMemory(intelhex);
                engineInit();
                exec();
              }
            };
            reader.readAsBinaryString(file.slice(0, file.size));
          }, false);
      }
  }

  function fillCanvas(canvas, color)
  {
      var context = canvas.getContext('2d');
      switch(color)
      {
          case "red":
              color = "#FF0000";
              break;
          case "green":
              color = "#00FF00";
              break;
          case "black":
              color = "#000000";
              break;
      }
      var imgData = context.getImageData(0,0,canvas.width,canvas.height);
      var cursor = canvas.width*canvas.height*4;
      while((cursor-=4))
      {
        imgData.data[cursor]   = parseInt(color.substr(1,2),16);
        imgData.data[cursor+1] = parseInt(color.substr(3,2),16);
        imgData.data[cursor+2] = parseInt(color.substr(5),16);
        imgData.data[cursor+3] = 0xFF;
      }
      imgData.data[cursor]   = parseInt(color.substr(1,2),16);
      imgData.data[cursor+1] = parseInt(color.substr(3,2),16);
      imgData.data[cursor+2] = parseInt(color.substr(5),16);
      imgData.data[cursor+3] = 0xFF;
      context.putImageData(imgData, 0, 0);
  }

  function refreshScreen()
  {
      var context = screen_canvas.getContext('2d');
      context.scale(scale,scale);
      context.drawImage(screen_buffer, 0, 0);
      context.scale(1/scale,1/scale);
  }

  function pinNumberToPinObject(pin_number)
  {
    var pin = null;
    switch(pin_number)
    {
      case 0:
        pin = B0;
        break;
      case 1:
        pin = B1;
        break;
      case 2:
        pin = B2;
        break;
      case 3:
        pin = B3;
        break;
      case 4:
        pin = B4;
        break;
      case 5:
        pin = B5;
        break;
      case 6:
        pin = B6;
        break;
      case 7:
        pin = B7;
        break;
      case 8:
        pin = C0;
        break;
      case 9:
        pin = C1;
        break;
      case 10:
        pin = C2;
        break;
      case 11:
        pin = C3;
        break;
      case 12:
        pin = C4;
        break;
      case 13:
        pin = C5;
        break;
      case 14:
        pin = C6;
        break;
      case 15:
        pin = C7;
        break;
      case 16:
        pin = D0;
        break;
      case 17:
        pin = D1;
        break;
      case 18:
        pin = D2;
        break;
      case 19:
        pin = D3;
        break;
      case 20:
        pin = D4;
        break;
      case 21:
        pin = D5;
        break;
      case 22:
        pin = D6;
        break;
      case 23:
        pin = D7;
        break;
      case 26:
        pin = E6;
        break;
      case 30:
        pin = E7;
        break;
      case 32:
        pin = F0;
        break;
      case 33:
        pin = F1;
        break;
      case 36:
        pin = F4;
        break;
      case 37:
        pin = F5;
        break;
      case 38:
        pin = F6;
        break;
      case 39:
        pin = F7;
        break;
    }

    return pin;
  }

  function popPortBuffer(queue, port)
  {
      if(!optimizationEnabled && !(forceOptimizationEnabled && (port == spipinport1*8 || port == spipinport2*8)))
      {
        var pin = null;
        // Disable all port pins
        for(i = 0; i < bitsPerPort; i++)
        {
          pin = pinNumberToPinObject(parseInt(i + port));
          if(pin)
          {
            //IsGreen?
            var data = pin.getContext('2d').getImageData(0, 0, 1, 1).data[1];
            if(data == 0xFF)
            {
              fillCanvas(pin, red_color);
            }
          }
        }
        queue = queue.shift();
        // Enable selected port pins
        for(i = 0; i < bitsPerPort; i++)
        {
           if(parseInt(queue) & 1 << i)
           {
             pin = pinNumberToPinObject(parseInt(i + port));
             if(pin)
             {
               fillCanvas(pin, green_color);
             }
           }
        }
      }
      else{
          queue.shift();
      }
  }

  function uartWrite(data)
  {
      uart.value.length == uartBufferLength - 1 && (uart.value = "");
      uart.value += String.fromCharCode(data);
  }

  function drawPixel(x, y, color)
  {
      if( x > screen_buffer.width-1 || y > screen_buffer.height-1 )
      {
        return;
      }
      var context = screen_buffer.getContext('2d');
      var imgData = context.getImageData(x,y,1,1);
      imgData.data[0] = parseInt(color.substr(1,2),16);
      imgData.data[1] = parseInt(color.substr(3,2),16);
      imgData.data[2] = parseInt(color.substr(5),16);
      imgData.data[3] = 0xFF;
      context.putImageData(imgData, x, y);
  }

  function fillScreen(color)
  {
      for(var y = 0; y < screen_buffer.height; y++)
      {
        for(var x = 0; x < screen_buffer.width; x++)
        {
          drawPixel( x, y, color );
        }
      }
  }

  function handleBreakpoint(address)
  {
      var index = softBreakpoints.indexOf(parseInt(address, 16)-flashStart+2);
      if(index >= 0)
      {
        alert("Breakpoint at 0x" + softBreakpoints[index].toString(16));
      }
  }

  function filterRelevantKeypress()
  {
      switch(event.which)
      {
        case 13:
            doDebugCommand();
            break;
        case 38:
            gdb_window.value = historyIndex >= 0 ?
            commandHistory[historyIndex--]: "";
            break;
      }
  }

  function writeMemoryWindow()
  {
    var i = SP;
    disasm.value = "";
    while(i < flashStart)
    {
      disasm.value += memory[i].toString(16) + " ";
      i++;
    }
  }

  function writeRegisterWindow()
  {
      R0.value = "0x"+r[0].toString(16);
      R1.value = "0x"+r[1].toString(16);
      R2.value = "0x"+r[2].toString(16);
      R3.value = "0x"+r[3].toString(16);
      R4.value = "0x"+r[4].toString(16);
      R5.value = "0x"+r[5].toString(16);
      R6.value = "0x"+r[6].toString(16);
      R7.value = "0x"+r[7].toString(16);
      R8.value = "0x"+r[8].toString(16);
      R9.value = "0x"+r[9].toString(16);
      R10.value = "0x"+r[10].toString(16);
      R11.value = "0x"+r[11].toString(16);
      R12.value = "0x"+r[12].toString(16);
      R13.value = "0x"+r[13].toString(16);
      R14.value = "0x"+r[14].toString(16);
      R15.value = "0x"+r[15].toString(16);
      R16.value = "0x"+r[16].toString(16);
      R17.value = "0x"+r[17].toString(16);
      R18.value = "0x"+r[18].toString(16);
      R19.value = "0x"+r[19].toString(16);
      R20.value = "0x"+r[20].toString(16);
      R21.value = "0x"+r[21].toString(16);
      R22.value = "0x"+r[22].toString(16);
      R23.value = "0x"+r[23].toString(16);
      R24.value = "0x"+r[24].toString(16);
      R25.value = "0x"+r[25].toString(16);
      R26.value = "0x"+r[26].toString(16);
      R27.value = "0x"+r[27].toString(16);
      R28.value = "0x"+r[28].toString(16);
      R29.value = "0x"+r[29].toString(16);
      R30.value = "0x"+r[30].toString(16);
      R31.value = "0x"+r[31].toString(16);
  }

  function writeBreakpointWindow()
  {
    while(breakpoints.firstChild)
    {
        breakpoints.removeChild(breakpoints.firstChild);
    }
    var i = softBreakpoints.length;
    while(i--)
    {
        var address = softBreakpoints[i]+flashStart;
        var breakpoint = document.createElement("li");
        if( PC == address )
        {
            breakpoint.style.color = "red";
        }
        breakpoint.appendChild(document.createTextNode(getDecodedLine(address)));
        breakpoints.appendChild(breakpoint);
    }
  }

  function doDebugCommand()
  {
      var command = gdb_window.value;
      commandHistory.push(command);
      historyIndex = commandHistory.length-1;
      handleDebugCommandString(command);
      gdb_window.value = "";
      writeMemoryWindow();
      writeRegisterWindow();
      writeBreakpointWindow();
      while(callstack.firstChild)
      {
        callstack.removeChild(callstack.firstChild);
      }
      backtrace(PC);
      gdb_window.focus();
  }

  function setDebugResult(result)
  {
      result_window.textContent = result;
  }

  function customizePortsLayout(element)
  {
      default_port_layout.style.display = "none";
      ports.appendChild(element);
  }

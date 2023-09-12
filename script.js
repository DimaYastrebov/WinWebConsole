const currentDate = new Date();
const formattedDate = currentDate.toISOString().replace(/[-:.T]/g, "");

const body = document.body;
const consoleWin = document.querySelector(".console");
const inputConsoleBlock = document.querySelector(".inputConsoleBlock");
const consoleOutput = document.querySelector(".play_console");
const inputField = document.querySelector("#console input");
const statusBar = document.querySelector(".status-bar");

let currentPath = getCookie("currentPath") || "c:/Windows/system32";
let textSpan = getCookie("currentPath") || "c:/Windows/system32"
const deletedPaths = getCookie("deletedPaths") || [];
const completedProcesses = JSON.parse(localStorage.getItem('completedProcesses')) || [];
let date = new Date;

const processes = [
  ' explorer.exe', ' svchost.exe', ' spoolsv.exe', ' lsass.exe',
  ' winlogon.exe', ' services.exe', ' conhost.exe', ' dllhost.exe',
  ' taskhost.exe', ' csrss.exe'
];

const commands = {
  calc: (args) => {
    if (args.length === 1) {
      try {
        const calc_result = eval(args[0]);
        addToConsole(`${calc_result}`, false)
      } catch (error) {
        addToConsole("ERROR")
        return;
      }
    }
  },
  cd: (args) => {
    if (args.length > 0) {
      const newPath = args.join(" ");
      if (isValidPathFormat(newPath)) {
        if (!deletedPaths.includes(newPath)) {
          currentPath = newPath;
          setCookie("currentPath", newPath);

          const pathSpan = document.getElementById("path-console-standart");
          pathSpan.textContent = currentPath + ">";

          const pathLength = currentPath.length * 12;
          const minLength = 95;

          if (pathSpan.textContent.length >= 10) {
            const additionalPixels = (pathSpan.textContent.length - 1) * 1;
            inputField.style.left = Math.max(minLength, 200 - pathLength - additionalPixels) + "px";
          } else {
            inputField.style.left = minLength + "px";
          }
        } else {
          addToConsole("Cannot access deleted path.", false);
        }
      } else {
        addToConsole("Invalid path format. Please use 'drive:/path'", false);
      }
    } else {
      addToConsole(currentPath, false);
      return;
    }
  },
  clear: () => {
    consoleOutput.innerHTML = "";
    return;
  },
  color: (args) => {
    function parseColor(input) {
      if (input.startsWith("rgb")) {
        const rgbValues = input.substring(3).trim();
        return `rgb(${rgbValues})`;
      } else {
        const namedColor = input.trim();
        const tempElement = document.createElement("div");
        tempElement.style.color = namedColor;
        document.body.appendChild(tempElement);
        const rgbColor = getComputedStyle(tempElement).color;
        document.body.removeChild(tempElement);
        return rgbColor;
      }
    }
  
    if (args.length >= 3) {
      const typeColor = args[0];
      const background = parseColor(args[1]);
      const textColor = parseColor(args[2]);
  
      consoleWin.style.background = background;
      consoleWin.style.color = textColor;
  
      addToConsole(`Background color set to: ${background}, Text color set to: ${textColor}`, false);
    } else {
      addToConsole("Usage: color <color-type> <background-color> <text-color>", false);
      addToConsole("example: color rgb/nex 255,255,255/#fff 0,0,0/#000", false);
    }
    return;
  },
  converter: (args) => {
    if (args.length === 3) {
      const value = parseFloat(args[0]);
      const fromUnit = args[1].toLowerCase();
      const toUnit = args[2].toLowerCase();

      const conversionRates = {
        meter: 1,
        foot: 3.28084,
        kilogram: 1,
        pound: 2.20462,
        liter: 1,
        gallon: 0.264172
      };

      if (conversionRates[fromUnit] && conversionRates[toUnit]) {
        const convertedValue = value * conversionRates[fromUnit] / conversionRates[toUnit];
        addToConsole(`${value} ${fromUnit} is approximately ${convertedValue.toFixed(2)} ${toUnit}`, false);
      } else {
        addToConsole("Unsupported units.", false);
      }
    } else {
      addToConsole("Usage: converter <value> <from-unit> <to-unit>. Meter, foot, kilogram, pound, liter, gallon", false);
    }
    return;
  },
  crypt: (args) => {
    if (args.length === 3) {
      const operation = args[0].toLowerCase();
      const encryptionType = args[1].toLowerCase();
      const text = args[2];

      let outputText = '';

      if (operation === "encode" && encryptionType === "base64") {
        try {
          const bytes = new TextEncoder().encode(text);
          const encodedText = btoa(String.fromCharCode(...bytes));
          outputText = `Encoded: ${encodedText}`;
        } catch (error) {
          outputText = `Encoding failed: ${error.message}`;
        }
      } else if (operation === "decode" && encryptionType === "base64") {
        try {
          const decodedText = atob(text);
          const bytes = new Uint8Array(decodedText.length);
          for (let i = 0; i < decodedText.length; i++) {
            bytes[i] = decodedText.charCodeAt(i);
          }
          const originalText = new TextDecoder().decode(bytes);
          outputText = `Decoded: ${originalText}`;
        } catch (error) {
          outputText = `Decoding failed: ${error.message}`;
        }
      } else {
        outputText = "Invalid operation or encryption type.";
      }

      addToConsole(outputText, false);
    } else {
      addToConsole("Usage: crypt <decode/encode> <base64> <\"text\">");
    }
    return;
  },
  copy: (args) => {
    const copytext = args[0];

    const tempInput = document.createElement('input');
    document.body.appendChild(tempInput);
    tempInput.value = copytext;
    tempInput.select();
    document.execCommand('copy');
    document.body.removeChild(tempInput);

    addToConsole('copy: ' + copytext, false);
    return;
  },
  curl: async (args) => {
    if (args.length >= 1) {
      const url = args[0];
  
      try {
        const response = await fetch(url, {
          mode: "no-cors"
        })
        if (response.ok) {
          const responseData = await response.text();
          addToConsole(responseData, false);
        } else {
          addToConsole(`Error: ${response.status} ${response.statusText}`, false);
        }
      } catch (error) {
        addToConsole("An error occurred while making the request.", false);
      }
    } else {
      addToConsole("Usage: curl <url>", false);
    }
    return;
  }, 
  date: () => {
    const dateObj = new Date();
    const formattedDate = `${dateObj.getFullYear()}-${(dateObj.getMonth() + 1).toString().padStart(2, '0')}-${dateObj.getDate().toString().padStart(2, '0')}`;
    addToConsole(formattedDate, false);
    return;
  },
  del: (args) => {
    if (args.length > 0) {
      const pathToDelete = args.join(" ");
      if (isValidPathFormat(pathToDelete)) {
        deletedPaths.push(pathToDelete);
        setCookie("deletedPaths", JSON.stringify(deletedPaths));
        addToConsole(`Deleted path: ${pathToDelete}`, false);
      } else {
        addToConsole("Invalid path format. Please use 'drive:/path'", false);
      }
    } else {
      addToConsole("Please provide a path to delete.", false);
    }
    return;
  },
  dir: () => {
    const fileList = [
      "file1.txt",
      "file2.txt",
      "folder1",
      "folder2"
    ];
    const fileListString = fileList.join("\n");
    addToConsole(fileListString, false);
    return;
  },
  echo: (args) => {
    const echoText = args.join(" ");
    addToConsole(echoText, false);
    return;
  },
  fact: async () => {
    try {
      const response = await fetch("https://uselessfacts.jsph.pl/random.json");
      if (response.ok) {
        const factData = await response.json();
        addToConsole(factData.text, false);
      } else {
        addToConsole("Unable to fetch fact at the moment.", false);
      }
    } catch (error) {
      addToConsole("An error occurred while fetching the fact.", false);
    }
    return;
  },
  hello: () => {
    addToConsole("Hello, there!", false);
    return;
  },
  help: () => {
    const availableCommands = Object.keys(commands).filter(cmd => cmd !== 'default').join(', ');
    addToConsole(`Available commands: ${availableCommands}`, false);
    return;
  },
  mkdir: (args) => {
    if (args.length > 0) {
      const newFolderName = args[0];
      const newPath = args.join(" ");
      currentPath = newPath;
      addToConsole(`Creating directory '${newFolderName}'`, false);

    } else {
      addToConsole("Please provide a folder name.", false);
    }
    return;
  },
  note: (args) => {
    if (args.length >= 1) {
      const noteText = args.join(" ");

      let existingNotes = localStorage.getItem("notes");
      if (!existingNotes) {
        existingNotes = "";
      }

      const updatedNotes = `${existingNotes}\n- ${noteText}`;
      localStorage.setItem("notes", updatedNotes);

      addToConsole("Note added and saved.", false);
    } else {
      let existingNotes = localStorage.getItem("notes");
      if (!existingNotes) {
        existingNotes = "No notes available. ";
        existingNotes = "Usage: note <text>";
      }
      addToConsole(existingNotes, false);
    }
    return;
  },
  password: (args) => {
    if (args.length >= 1) {
      const length = parseInt(args[0]);
      const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
      let newPassword = "";

      for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        newPassword += characters.charAt(randomIndex);
      }

      addToConsole(`Generated password: ${newPassword}`, true);
    } else {
      addToConsole("Usage: password <length>", true);
    }
    return;
  },
  ping: async () => {
    const startTime = performance.now();
    try {
      const response = await fetch("https://www.dimayastrebov.website");
      const endTime = performance.now();
      const pingTime = endTime - startTime;
      addToConsole(`Ping Time: ${pingTime.toFixed(2)} ms`, false);
    } catch (error) {
      addToConsole("Ping failed.", false);
    }
    return;
  },
  random: () => {
    const randomNumber = Math.floor(Math.random() * 100) + 1;
    addToConsole(`Random number: ${randomNumber}!`, false);
    return;
  },
  search: (args) => {
    if (args.length >= 1) {
      const query = args.join(' ');
      const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
      window.open(searchUrl, '_blank');
      addToConsole(`Searching for: ${query}`, false);
    } else {
      addToConsole("Usage: search <query>", false);
    }
    return;
  },
  time: () => {
    const dateObj = new Date();
    const formattedTime = `${dateObj.getHours().toString().padStart(2, '0')}:${dateObj.getMinutes().toString().padStart(2, '0')}:${dateObj.getSeconds().toString().padStart(2, '0')}`;
    addToConsole(formattedTime, false);
    return;
    
  },
  timer: (args) => {
    let timerInProgress = false;
    inputField.blur();
    inputField.disabled = true;

    const startTimer = (duration) => {
      timerInProgress = true;
      addToConsole(`Timer set for ${duration} seconds.`, false);
      setTimeout(() => {
        addToConsole(`Timer expired after ${duration} seconds!`, false);
        inputField.disabled = false;
        inputField.focus();
        timerInProgress = false;
      }, duration * 1000);
    };
    if (!timerInProgress) {
      if (args.length >= 1) {
        const duration = parseInt(args[0], 10);

        if (!isNaN(duration) && duration > 0) {
          startTimer(duration);
        } else {
          addToConsole("Please provide a valid positive number for the timer duration.", true);
        }
      } else {
        addToConsole("Usage: timer <duration in seconds>", true);
        inputField.disabled = false;
        inputField.focus();
      }
    } else {
      addToConsole("A timer is already in progress. Wait for it to finish.", true);
    }
    return;
  },
  windows: () => {
    addToConsole("Welcome to Windows Command Prompt! You're not really in Windows, though. :)", false);
    return;
  }, 
  lorem: async () => {
    try {
      const response = await fetch('https://baconipsum.com/api/?type=all-meat&paras=2&start-with-lorem=1');
      if (response.ok) {
        const loremText = await response.json();
        addToConsole(loremText[0], false);
      } else {
        addToConsole('Unable to fetch lorem text at the moment.', false);
      }
    } catch (error) {
      addToConsole('An error occurred while fetching lorem text.', false);
    }
    return;
  },
  systeminfo: () => {
    inputField.blur();
    inputField.disabled = true;
    let consoleMessage;

    consoleMessage = addToConsole("Loading operating system information ...", false);

    setTimeout(() => {
      consoleMessage.replaceLastLine("Loading processor information ...");
    }, Math.random() * 1000 + 500);
  
    setTimeout(() => {
      consoleMessage.replaceLastLine("Loading time zone information ...");
    }, Math.random() * 1200 + 500);
  
    setTimeout(() => {
      consoleMessage.replaceLastLine("Loading profile information ...");
    }, Math.random() * 2200 + 500);
  
    setTimeout(() => {
      consoleMessage.replaceLastLine("Loading update information ...");
    }, Math.random() * 3200 + 500);

    setTimeout(() => {
      consoleMessage.replaceLastLine("Loading memory information ...");
    }, Math.random() * 3400 + 500);
    
    setTimeout(() => {
      consoleMessage.replaceLastLine("Loading storage information ...");
    }, Math.random() * 3600 + 500);

    setTimeout(() => {
      consoleMessage.replaceLastLine("Loading network information ...");
    }, Math.random() * 3800 + 500);
    
    setTimeout(() => {
      consoleMessage.replaceLastLine("Loading security information ...");
    }, Math.random() * 4000 + 500);
    
    setTimeout(() => {
      consoleMessage.replaceLastLine("Loading graphics information ...");
    }, Math.random() * 4200 + 500);
    
    setTimeout(() => {
      consoleMessage.replaceLastLine("Loading drivers information ...");
    }, Math.random() * 4400 + 500);
    
    setTimeout(() => {
      consoleMessage.replaceLastLine("Loading peripherals information ...");
    }, Math.random() * 4600 + 500);
    
    setTimeout(() => {
      consoleMessage.replaceLastLine("Loading applications information ...");
    }, Math.random() * 4800 + 500);
    
    setTimeout(() => {
      consoleMessage.replaceLastLine("Loading services information ...");
    }, Math.random() * 5000 + 500);
    
    setTimeout(() => {
      consoleMessage.replaceLastLine("Loading configuration information ...");
    }, Math.random() * 5200 + 500);
    
    setTimeout(() => {
      consoleMessage.replaceLastLine("Loading diagnostics information ...");
    }, Math.random() * 5400 + 500);
    
    setTimeout(() => {
      consoleMessage.replaceLastLine("Loading troubleshooting information ...");
    }, Math.random() * 5600 + 500);

    setTimeout(() => {
      consoleMessage.removeLastLine();
      inputField.disabled = false;
      inputField.focus();
      addToConsole("Host Name: ㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤSERVER-RACK01", false);
      addToConsole("OS Name: ㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤDimaYastreb's Windows Server 2023 Datacenter", false);
      addToConsole("OS Version:ㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤ10.0.22621 N/A Build 22621", false);
      addToConsole("OS Manufacturer:ㅤㅤㅤㅤㅤㅤㅤㅤㅤDimaYastreb's Inc", false);
      addToConsole("OS Configuration: ㅤㅤㅤㅤㅤㅤㅤㅤServer", false);
      addToConsole("OS Build Type:ㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤMultiprocessor", false);
      addToConsole("Registered Owner:ㅤㅤㅤㅤㅤㅤㅤㅤauthor@dimayastrebov.website", false);
      addToConsole("Registered Organization:ㅤㅤㅤㅤDimaYastreb's Corp", false);
      addToConsole("Product ID:ㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤ12345-67890-ABCDE-FGHIJ", false);
      addToConsole("Original Install Date:ㅤㅤㅤㅤㅤ07/15/2023, 10:00:00", false);
      addToConsole("System Boot Time:ㅤㅤㅤㅤㅤㅤㅤㅤ08/20/2023, 02:30:45", false);
      addToConsole("System Manufacturer:ㅤㅤㅤㅤㅤㅤDimaYastreb's Server Inc.", false);
      addToConsole("System Model:ㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤES-1234", false);
      addToConsole("System Type:ㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤx64-based Server", false);
      addToConsole("Processor(s):ㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤ 2 Processor(s) Installed.", false);
      addToConsole("[01]:ㅤAMD EPYC 7773X CPU @ 4.20 GHz", false);
      addToConsole("[02]:ㅤAMD EPYC 7773X CPU @ 4.20 GHz", false);
      addToConsole("BIOS Version: ㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤBIOS Inc. V2.3, 05/25/2023", false);
      addToConsole("Windows Directory: ㅤㅤㅤㅤㅤㅤㅤC:\\Windows", false);
      addToConsole("System Directory:ㅤㅤㅤㅤㅤㅤㅤㅤC:\\Windows\\system32", false);
      addToConsole("Boot Device: ㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤ\\Device\\HarddiskVolume1", false);
      addToConsole("System Locale: ㅤㅤㅤㅤㅤㅤㅤㅤㅤen-us;English (United States)", false);
      addToConsole("Input Locale:ㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤen-us;English (United States)", false);
      addToConsole(`Time Zone: ㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤ${date}`, false);
      addToConsole("Total Physical Memory:ㅤㅤㅤㅤㅤ128,000 MB", false);
      addToConsole("Available Physical Memory: ㅤㅤ45,000 MB", false);
      addToConsole("Virtual Memory: Max Size:ㅤㅤㅤ256,000 MB", false);
      addToConsole("Virtual Memory: Available: ㅤㅤ115,000 MB", false);
      addToConsole("Virtual Memory: In Use:ㅤㅤㅤㅤ141,000 MB", false);
      addToConsole("Page File Location(s): ㅤㅤㅤㅤC:\\pagefile.sys", false);
      addToConsole("Domain: ㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤdimayastrebov.website", false);
      addToConsole("Logon Server: ㅤㅤㅤㅤㅤㅤㅤㅤㅤ\\\\SERVER-RACK01", false);
      addToConsole("Hotfix(s):ㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤ7 Hotfix(s) Installed.", false);
    }, Math.random() * 6000 + 4000)
    return;
  },
  ver: () => {
    addToConsole("DimaYastreb's Windows [version 11.0.1224]", false)
    return;
  },
  whoami: () => {
    addToConsole("SERVER-RACK01/User", false);
    return;
  },
  tasklist: () => {
    inputField.blur();
    inputField.disabled = true;
    const loading_tasklist = addToConsole(`loading ...`, false);
  
    setTimeout(() => {
      loading_tasklist.removeLastLine();
      inputField.disabled = false;
      addToConsole(processes);
      inputField.focus();
    }, 3000);
    return;
  },           
  taskkill: (args) => {
    const klt = args[0];

    if (!klt) {
      addToConsole("Usage: taskkill <process_name>", false);
      return;
    }

    if (klt === "csrss.exe") {
      inputField.style.display = "none";
      consoleWin.style.cursor = "wait";
      consoleWin.style.animation = "hangingAnimation 0.7s forwards"
      consoleWin.style.userSelect = "none"
      setTimeout(() => {
        consoleWin.style.display = "none";
      }, 10000);
    } else {
      addToConsole(`Terminating process: ${klt}`);
    }
    if (klt === "explorer.exe") {
      const window_nickname_taskkill = document.querySelector(".window-nickname");
      const headerDiv = document.querySelector(".header");
      const headerTag = document.querySelector("header");
      setTimeout(() => {
        body.style.background = "#000";
      }, 200);
      setTimeout(() => {
        headerDiv.style.display = "none";
      }, 300);
      setTimeout(() => {
        headerTag.style.display = "none";
      }, 400);
      setTimeout(() => {
        window_nickname_taskkill.style.display = "none";
      }, 500);
    } else {
      addToConsole(`Terminating process: ${klt}`);
    }
    if (klt === "cmd.exe") {
      const window_nickname_taskkill = document.querySelector(".window-nickname");
      const headerDiv = document.querySelector(".header");
      const headerTag = document.querySelector("header");
      setTimeout(() => {
        consoleWin.style.display = "none";
        body.style.background = "#000";
      }, 100);
      setTimeout(() => {
        headerDiv.style.display = "none";
      }, 150);
      setTimeout(() => {
        headerTag.style.display = "none";
      }, 200);
      setTimeout(() => {
        window_nickname_taskkill.style.display = "none";
      }, 250);
    } else {
      addToConsole(`Terminating process: ${klt}`);
    }
    return;
  },
  runas: (args) => {
    const runas_user = args[0];
    const runas_task = args[1];

    if (runas_user === undefined && runas_task === undefined) {
      addToConsole("Usage: runas <user> <task>", false)
    }

    if (runas_user === "admin" && runas_task === "explorer.exe") {
        const window_nickname_taskkill = document.querySelector(".window-nickname");
        const headerDiv = document.querySelector(".header");
        const headerTag = document.querySelector("header");
        setTimeout(() => {
          headerTag.style.display = "block";
          body.style.background = "#0e5ee9";
        }, 200);
        setTimeout(() => {
          headerDiv.style.display = "block";
          window_nickname_taskkill.style.display = "block";
        }, 300);
      } else {
        addToConsole(`Start process: ${klt}`);
    } 
    return;
  },
  type: (args) => {
    const file_name = args[0];
    
    const file_type = {
      "help.js": "const availableCommands = Object.keys(commands).filter(cmd => cmd !== 'default').join(', '); addToConsole(`Available commands: ${availableCommands}`, false);"
    };
    const file_byte = {
      "help.js": "23 byte"
    };
  
    if (file_name === "help.js") {
      addToConsole(file_type[file_name], false);
      const loadingMessage = addToConsole(`File size: loading ...`, false);
  
      setTimeout(() => {
        loadingMessage.replaceLastLine(`File size: ${file_byte[file_name]}`, false);
      }, 1200);
    } else {
      addToConsole("Usage: type <file_name>", false);
    }
    return;
  },
  netstat: () => {
    let loadnetworkMessage;
    const ports = [
      { port: "80", delay: Math.floor(Math.random() * 300) + 100 },
      { port: "443", delay: Math.floor(Math.random() * 300) + 100 },
      { port: "3389", delay: Math.floor(Math.random() * 300) + 100 },
      { port: "8080", delay: Math.floor(Math.random() * 300) + 100 },
      { port: "22", delay: Math.floor(Math.random() * 300) + 100 },
      { port: "53", delay: Math.floor(Math.random() * 300) + 100 }
    ];

    addToConsole("Active Connections", false);
    addToConsole("ProtoㅤLocal AddressㅤㅤㅤㅤㅤForeign AddressㅤㅤㅤㅤㅤState", false);
  
    ports.forEach(({ port, delay }) => {
      setTimeout(() => {
        addToConsole(`TCPㅤㅤ192.168.1.2:${port}ㅤㅤㅤㅤ0.0.0.0:0ㅤㅤㅤㅤㅤㅤLISTENING`, false);
      }, delay);
    });
    return;
  },
  bcdedit: () => {
    addToConsole("Unable to open boot configuration data.", false); 
    addToConsole("Access is denied.", false);
    inputField.focus();
    return;
  },
  gpupdate: (args) => {
    inputField.focus();
    const args_gpupdate = args[0];
  
    if (args_gpupdate === undefined || args_gpupdate === "") {
      addToConsole("Usage: gpupdate <args>", false);
    }

    if (args_gpupdate === "/force") {
      inputField.blur();
      inputField.disabled = true;
      addToConsole("Updating policy...", false);
  
      setTimeout(() => {
        addToConsole("Computer policy update has completed successfully.", false);
      }, Math.floor(Math.random() * (5000 - 3000 + 1)) + 5000);

      setTimeout(() => {
        addToConsole("User policy update has completed successfully.", false);
        inputField.disabled = false;
        inputField.focus();
      }, Math.floor(Math.random() * (9000 - 7000 + 1)) + 7000);
    }
    return;
  },
  sfc: (args) => {
    const args_sfc = args[0];

    if (args_sfc === undefined || args_sfc === "") {
      addToConsole("Usage: sfc <args>", false);
    }

    if (args_sfc === "/scannow") {
      addToConsole("You must be an administrator running a console session", false);
      addToConsole("in order to use the sfc utility.", false);
    }
    return;
  },
  tree: (args) => {
    const args_tree = args[0];
  
    if (args_tree === undefined || args_tree === "") {
      addToConsole('Usage: tree "<drive>:\\<path>"', false);
      return;
    }

    if (args_tree[0] !== '"' || args_tree[args_tree.length - 1] !== '"') {
      addToConsole("Invalid path. Please write in path double quotes.", false);
      return;
    }
  
    const path = args_tree.slice(1, -1);
  
    const normalized_path = path.replace(/\//g, "\\");
  
    const drive = normalized_path[0].toUpperCase();
  
    const rest = normalized_path.slice(1);
  
    const final_path = drive + rest;
  
    if (final_path === "C:\\") {
      addToConsole("C:\\", false);
      addToConsole("├───Program Files", false);
      addToConsole("├───Users", false);
      addToConsole("└───Windows", false);
    } else if (final_path === "C:\\Program Files") {
      addToConsole("C:\\Program Files", false);
      addToConsole("├───Common Files", false);
      addToConsole("├───Internet Explorer", false);
      addToConsole("└───Windows Defender", false);
    } else if (final_path === "C:\\Users") {
      addToConsole("C:\\Users", false);
      addToConsole("└───user", false);
    } else if (final_path === "C:\\Windows") {
      addToConsole("C:\\Windows", false);
      addToConsole("├───System32", false);
      addToConsole("├───Fonts", false);
      addToConsole("└───Temp", false);
    }
    return;
  },    
  ipconfig: () => {
    addToConsole("Windows IP Configuration", false);
    addToConsole("Ethernet adapter Ethernet:", false);
    addToConsole("Connection-specific DNS Suffixㅤ. . . . . . :", false);
    addToConsole("IPv4 Address. . . . . . . . . . . . : 10.20.30.40", false);
    addToConsole("Subnet Mask . . . . . . . . . . . . : 255.255.255.128", false);
    addToConsole("Default Gateway . . . . . . . . : 10.20.30.1", false);
    return;
  },
  error: async (args) => {
    if (args.length < 14) {
      addToConsole("author API(generator): Shikoshib. Website: <a id='link_console' href='https://shikoshib.ru' target='_blank'>https://shikoshib.ru</a>, youtube: <a id='link_console' href='https://www.youtube.com/@sksb23' target='_blank'>https://www.youtube.com/@sksb23</a>", false, true);
      addToConsole('usage: error win10 "Error test" "title" icon_id "content" "button1" button1disabled button1rec "button2" button2disabled button2rec "button3" button3disabled button3rec', false);
      addToConsole('example: ', false);
      addToConsole('args - os:', false);
      addToConsole('win1 - Windows 1.0<br>win31 - Windows 3.1<br>win95 - Windows 95<br>winmem - Windows Memphis<br>win98 - Windows 98<br>win2k - Windows 2000<br>winwh - Windows Whistler<br>winxp - Windows XP<br>winlh - 4093 - Windows Longhorn build 4093<br>win7 - Windows Vista/7<br>win8 - Windows 8.1<br>win10 - Windows 10<br>win11 - Windows 11', false, true);
      addToConsole('title: Error title content: Error content<br>icon: Icon ID (<a id="link_console" href="https://shikoshib.ru/err/icons" target="_blank">icons here</a>)<br>button1: Text on button 1<br>button1disabled: Is button 1 disabled (true or false)<br>button1rec: Is button 1 recommended (true or false)<br>button2: Text on button 2<br>button2disabled: Is button 2 disabled (true or false)<br>button2rec: Is button 2 recommended (true or false)<br>button3: Text on button 3<br>button3disabled: Is button 3 disabled (true or false)<br>button3rec: Is button 3 recommended (true or false)<br>crossDisabled: Is the cross disabled (true or false)', false, true);
      return;
    }
  
    const os_error = args[0];
    const title_error = args[1];
    const content_error = args[2];
    const icon_error = args[3];
    const button1_error = args[4];
    const button1disabled_error = args[5];
    const button1rec_error = args[6];
    const button2_error = args[7];
    const button2disabled_error = args[8];
    const button2rec_error = args[9];
    const button3_error = args[10];
    const button3disabled_error = args[11];
    const button3rec_error = args[12];
    const crossDisabled = args[13];
  
    const os_error_map = {
      win1: "win1",
      win31: "win31",
      win95: "win95",
      winmem: "winmem",
      win98: "win98",
      win2k: "in2k",
      winwh: "winwh",
      winxp: "winxp",
      winlh4093: "winlh4093",
      win7: "win7",
      win8: "win8",
      win10: "win10",
      win11: "win11"
    };

    const stringify = (value) => {
      if (typeof value === "string") {
        return value.replace(/"/g, "");
      } else if (typeof value === "boolean") {
        return String(value);
      } else {
        return value;
      }
    };
    
    const queryParams = new URLSearchParams({
      os: stringify(os_error_map[os_error]),
      title: stringify(title_error),
      content: stringify(content_error),
      icon: icon_error,
      button1: stringify(button1_error),
      button1disabled: button1disabled_error,
      button1rec: button1rec_error,
      button2: stringify(button2_error),
      button2disabled: button2disabled_error,
      button2rec: button2rec_error,
      button3: stringify(button3_error),
      button3disabled: button3disabled_error,
      button3rec: button3rec_error,
      crossDisabled: crossDisabled,
      base64: true
    });
    
  
    const apiEndpoint = "https://mipper.shikoshib.ru/api/winerr/";
    const url_error_img = `${apiEndpoint}?${queryParams}`;
  
    try {
      const response = await fetch(url_error_img);
      const data = await response.text();
  
      const url_error_api_img = data;
  
      const consoleMessage = addToConsole(`<img src='${url_error_api_img}'><br><a href="${url_error_api_img}" id="link_console" download>Download</a>`, false, true);
      console.log(url_error_api_img);
    } catch (error) {
      console.error(error);
    }
  },
  default: (args, commandString) => {
    addToConsole(`"${commandString}" not recognized. Type 'help' for a list of commands.`, false);
    return;
  },
};


function isValidPathFormat(path) {
  const pathRegex = /^[A-Za-z]:\/\w+/;
  return pathRegex.test(path);
}

function addToConsole(text, isCommand = false, isHtml = false) {
  const logEntry = {
    timestamp: new Date(),
    command: text,
    output: [],
    isHtmlOutput: isHtml
  };

  if (isCommand) {
    logEntry.output.push(currentPath + ">" + text);
  } else {
    logEntry.output.push(text);
  }

  completedProcesses.push(logEntry);
  localStorage.setItem('completedProcesses', JSON.stringify(completedProcesses));

  const xhr = new XMLHttpRequest();
  xhr.open('POST', '/assets/php/saveLog.php', true);
  xhr.setRequestHeader('Content-Type', 'application/json');

  xhr.onreadystatechange = function() {
    if (xhr.readyState === XMLHttpRequest.DONE) {
      if (xhr.status === 200) {
        console.log('Saved Log.');
      } else {
        console.error('ERROR TO SAVE LOG.');
      }
    }
  };

  xhr.send(JSON.stringify(logEntry));

  const newLine = document.createElement("div");
  const pathSpan = document.createElement("span");
  pathSpan.textContent = currentPath + ">";
  pathSpan.style.color = "";

  const textSpan = document.createElement(isHtml ? "div" : "span");
  textSpan[isHtml ? "innerHTML" : "textContent"] = text;
  if (isCommand) {
    newLine.appendChild(pathSpan);
  }

  newLine.appendChild(textSpan);

  const emptyLine = document.createElement("br");
  newLine.appendChild(emptyLine);

  const lineBreak = document.createElement("br");
  newLine.appendChild(lineBreak);

  consoleOutput.appendChild(newLine);

  if (consoleWin.classList.contains("fullscreen")) {
    consoleOutput.scrollTop = consoleOutput.scrollHeight;
    window.scrollTo(0, document.body.scrollHeight);
  }

  return {
    replaceLastLine: (replacementText) => {
      textSpan[isHtml ? "innerHTML" : "textContent"] = replacementText;
    },
    removeLastLine: () => {
      newLine.remove();
    }
  };
}


inputField.addEventListener("keydown", function(event) {
  if (event.key === "Enter") {
    const commandString = inputField.value.trim();
    const commandParts = commandString.split(" ");
    const commandName = commandParts[0].toLowerCase();
    const args = commandParts.slice(1);

    addToConsole(commandString, true);
    inputField.value = "";

    if (commandString === "") {
      addToConsole(`${pathSpan.textContent}`, false);
      if (consoleWin.classList.contains("fullscreen")) {
        consoleOutput.scrollTop = consoleOutput.scrollHeight;
      }
    }

    if (consoleWin.classList.contains("fullscreen")) {
      consoleOutput.scrollTop = consoleOutput.scrollHeight;
    }

    const commandFunction = commands[commandName] || commands.default;
    commandFunction(args, commandString);
  }
});

function setCookie(name, value) {
  document.cookie = `${name}=${value}`;
}

function getCookie(name) {
  const cookies = document.cookie.split(';');
  for (let i = 0; i < cookies.length; i++) {
    const cookie = cookies[i].trim();
    if (cookie.startsWith(name + '=')) {
      const cookieValue = cookie.substring(name.length + 1);
      try {
        return JSON.parse(cookieValue);
      } catch (error) {
        return cookieValue;
      }
    }
  }
  return null;
}

function MediaScreenInput(x) {
  if (x.matches) {
    inputField.style.width = "100px";
  } else if (y.matches) {
    inputField.style.width = "200px";     
  } else if (z.matches) {
    inputField.style.width = "300px";
  } else if (w.matches) {
    inputField.style.width = "400px";
  } else {
    inputField.style.width = "500px";
  }
}

var x = window.matchMedia("(max-width: 500px)");
var y = window.matchMedia("(max-width: 900px)");
var z = window.matchMedia("(max-width: 1200px)");
var w = window.matchMedia("(max-width: 1300px)");
MediaScreenInput(x);
MediaScreenInput(y);
MediaScreenInput(z);
MediaScreenInput(w);
x.addListener(MediaScreenInput);
y.addListener(MediaScreenInput);
z.addListener(MediaScreenInput);
w.addListener(MediaScreenInput);

const fullscreenConsoleBtn = document.getElementById("fullscreen_console");

if (fullscreenConsoleBtn) {
  fullscreenConsoleBtn.addEventListener("click", function() {
    if (consoleWin.classList.contains("fullscreen")) {
      consoleWin.classList.remove("fullscreen");
      fullscreenConsoleBtn.textContent = "remove";
    } else {
      consoleWin.classList.add("fullscreen");
      fullscreenConsoleBtn.textContent = "add";
    }
    
    inputField.blur();
    setTimeout(() => {
      inputField.focus();
    }, 100); 
  });
}

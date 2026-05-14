var theContact = "";
var regexEmail = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

function verifyVixSignInLink(root, respuesta, subject, context) {

  if (subject?.includes("Inicia sesión en tu cuenta de Vix") === false) {
    return respuesta;
  }


  if (context?.from?.includes("vix@vix.com") === false) {
    return respuesta;
  }

  var linkElement = Array.from(root.querySelectorAll("a[style*='#ff5900'][style*='color:#FFFFFF;font-size:20px']"))?.filter(a => a.innerText.includes('Iniciar sesión'))[0] || null;

  if (!linkElement) return respuesta;

  var bodyText = root.querySelector('body').innerText;

  if (!(bodyText.includes("Hemos recibido una solicitud para iniciar sesión en tu cuenta de Vix app.") && bodyText.includes("Este enlace expirará en 15 minutos por tu seguridad."))) return respuesta;

  if (linkElement._attrs?.href?.startsWith('http://link.vix.com/ls/click?upn=')) {
    respuesta.noError = true;
    respuesta.about = 'Codigo para iniciar sesion en Vix [Valido por 15 Min]';
    respuesta.link = linkElement._attrs.href;
    return respuesta;
  }

  return respuesta;
}


function verifyChatGpt(root, respuesta, subject, context) {

  var openAiCodeRegex = /(?:^|\D)(\d{6})(?!\d)/;
  var from = String(context?.from || "").toLowerCase();
  var bodyText = root.querySelector("body")?.innerText || root.innerText || root.textContent || "";
  var normalizedSubject = String(subject || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  var normalizedBody = String(bodyText || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  var isOpenAiSender = !from || from.includes("openai.com");
  var isChatGptCode =
    normalizedSubject.includes("your chatgpt code is") ||
    normalizedSubject.includes("tu codigo de chatgpt es") ||
    normalizedSubject.includes("your temporary chatgpt login code") ||
    normalizedSubject.includes("tu codigo de inicio de sesion temporal de chatgpt") ||
    normalizedSubject.includes("tu codigo de openai es") ||
    normalizedBody.includes("chatgpt log-in code") ||
    normalizedBody.includes("chatgpt login code") ||
    (normalizedBody.includes("introduce este codigo de verificacion temporal") && (normalizedBody.includes("openai") || normalizedBody.includes("chatgpt")));
  var openAiCode = (String(subject || "").match(openAiCodeRegex) || bodyText.match(openAiCodeRegex))?.[1];

  if (isOpenAiSender && isChatGptCode && openAiCode) {
    respuesta.noError = true;
    respuesta.code = openAiCode;
    context.keyword = "chatgpt";
    respuesta.about = 'Codigo de verificacion Para Iniciar Sesion en ChatGPT'
    console.log("Es de ChatGPT codigo")

    return respuesta
  }

  var chatgptCodeRegex = /\d{6}/g;
  if (!(subject.includes("Your ChatGPT code is") || subject.includes("Tu código de ChatGPT es"))) return respuesta;
  //FORMATO APP PRIMEVIDEO:
  var codigo = subject.match(chatgptCodeRegex);

  if (codigo === null) return respuesta;

  var codigo = codigo[0];

  respuesta.noError = true;
  respuesta.code = codigo;
  context.keyword = "chatgpt";
  respuesta.about = 'Codigo de verificacion Para Iniciar Sesion en ChatGPT'
  console.log("Es de ChatGPT codigo")

  return respuesta

}


function verifyAppleTv(root, respuesta, subject, context) {

  var sixDigitsRegex = /^\d{6}$/;

  if (context?.from?.includes("@apple.com") === false) {
    return respuesta;
  }

  var codeEle = root.querySelector("#main > div.container > div > p:nth-child(1) > b");

  if (!codeEle) return respuesta;
  
  if (!(codeEle.textContent && codeEle.textContent.trim() !== '')) return respuesta;
  
  var regexMatch = codeEle.textContent.trim().match(sixDigitsRegex)
  
  if (regexMatch) {
    console.log("Es codigo de apple tv")
    context.keyword = "apple"
    respuesta.noError = true;
    respuesta.about = 'Codigo para iniciar sesion en Apple TV';
    respuesta.code = codeEle.textContent.trim();
    return respuesta;
  }
  
  console.log("No es de apple tv")
  return respuesta;
}

function verfiyNetflixAccountChanges(root, respuesta, subject, context) {

  var sixDigitsRegex = /^\d{6}$/;
  if (context?.from?.includes("info@account.netflix.com") === false) {
    return respuesta;
  }
  var codeEle = root.querySelector("body > table > tbody > tr > td > table > tbody > tr:nth-child(2) > td > table:nth-child(3) > tbody > tr > td")
  if (!codeEle) return respuesta;
  if (!(codeEle.textContent && codeEle.textContent.trim() !== '')) return respuesta;
  var regexMatch = codeEle.textContent.match(sixDigitsRegex)
  if (regexMatch) {
    context.keyword = 'netflix';
    respuesta.noError = true;
    respuesta.about = 'Codigo para cambios netflix (🚫 No Dar Al Cliente 🚫)';
    context.sendJustIf = '{netflix-account-changes}'
    respuesta.code = codeEle.textContent;
    return respuesta
    
  }

  return respuesta;
}


function verifyDisneyEmailChange(root, respuesta, subject, context) {
 
  if (context?.from?.includes("disneyplus@trx.mail2.disneyplus.com") === false) {
    return respuesta;
  }
  var htmlText = root.outerHTML;
  if (htmlText.includes("Correo electrónico de MyDisney actualizado")) {
    console.log("Se detecto un cambio el correo de disney " + context.to)
    context.keyword = "disney";
    context.fraud = true;
    respuesta.noError = true;
    return respuesta
  }

  console.log("No se detecto cambio de email (robo de disney)")

  return respuesta;
}

function verifyAmazon(root, respuesta, subject, context) {

    
    var regexSixNumberAmazon = /^\d{6}$/g;
    if(subject.includes("Recuperación de contraseña") || subject.includes("Password recovery") ) return respuesta;
    //FORMATO APP PRIMEVIDEO:
    var emailHtml = root.querySelector("body table > tbody > tr > td > div > table > tbody > tr > td > div:nth-child(5) > table > tbody > tr > td > div > table > tbody > tr > td > table > tbody > tr:nth-child(4) > td > div > span");

    if (emailHtml?.innerText?.trim()?.match(regexSixNumberAmazon)?.length > 0) {
        context.keyword = "prime";
        console.log("Es de prime video app");
        respuesta.noError = true;
        respuesta.code = emailHtml?.innerText?.trim()?.match(regexSixNumberAmazon)[0];
        respuesta.about = 'Codigo de verificacion Para Iniciar Sesion en Prime Video'
        return respuesta
    }


    //FORMATO PAGINA PRIMEVIDEO.COM
    var emailHtml = root.querySelector("body table > tbody > tr > td > table > tbody > tr:nth-child(6) > td > p");

   
    if (emailHtml?.innerText?.trim()?.match(regexSixNumberAmazon)?.length > 0) {
        console.log("Es de primevideo.com")
        context.keyword = "prime";
        
        respuesta.noError = true;
        respuesta.code = emailHtml?.innerText?.trim()?.match(regexSixNumberAmazon)[0];
        respuesta.about = 'Codigo de verificacion Para Iniciar Sesion en Prime Video'
        
        return respuesta
    }


    //FORMATO DE CORREO EN HOLANDES DE PRIMEVIDEO.com (PUEDE SER QUE SEA SOLO ESTE, O EN GENERAL PRIME HAYA CAMBIADO)
    var emailHtml = root.querySelector("body table > tbody > tr > td > table > tbody > tr:nth-child(5) > td > p");
   
   
    if (emailHtml?.innerText?.trim()?.match(regexSixNumberAmazon)?.length > 0) {
        context.keyword = "prime";
        
        console.log('Es de primevideo.com "HOLANDES"')
        respuesta.noError = true;
        respuesta.code = emailHtml?.innerText?.trim()?.match(regexSixNumberAmazon)[0];
        respuesta.about = 'Codigo de verificacion Para Iniciar Sesion en Prime Video'
        
        return respuesta
    }




    console.log("no es de amazon");
    return respuesta;
}

function verifyYoutube(root, respuesta, context) {
    //console.log("comprobando si es de yt")
    var regexSixNumberMax = /^\d{6}$/g;
    if (context?.from?.includes("noreply@google.com") === false) {
      return respuesta;
    }
    
    //if(subject.includes("Recuperación de contraseña") || subject.includes("Password recovery") ) return respuesta;
    //3 factores para identifar el correo
   var codeElement = root.querySelector("tr:nth-child(2) > td > div > p > strong");
   var aElement = root.querySelector("tr:nth-child(2) > td > p:nth-child(5) > a");
   var emailElement = root.querySelector("tr:nth-child(2) > td > p:nth-child(2) > span");
    
    if (codeElement && aElement && emailElement) {
        var code = codeElement?.innerText?.trim();
        var link = aElement?.attributes?.href?.trim();
        var email = emailElement?.innerText?.trim();
        if(code?.match(regexSixNumberMax) && 
           link?.startsWith("https://accounts.google.com/AccountDisavow?adt=") && 
           email?.match(regexEmail)){
                context.keyword = "youtube";

                console.log("Es  codigo de verificacion de cuenta de yt");
                respuesta.noError = true;
                respuesta.code = code;
                respuesta.about = 'Codigo de verificacion Para Iniciar Sesion Youtube (Gmail)'
                context.to = email;
                console.log("se cambio la propiedad 'context.to' a '"+email+"'")
        
                return respuesta
           }
    
    }

    

    console.log("no es de YOutube");
    return respuesta;
}
function getEnvironment() {
  if (typeof UrlFetchApp !== 'undefined') return 'GAS';
  if (typeof process !== 'undefined' && process.versions && process.versions.node) return 'NODE';
  if (typeof window !== 'undefined') return 'BROWSER';
  return 'UNKNOWN';
}

// Este es el contenido de tu archivo remoto
(function() {
  // Verificamos si existe UrlFetchApp (Sello de identidad de GAS)
  if (getEnvironment() === "GAS") {
    
    // 1. Definimos el acortador
    globalThis.shortUrl = function(urlOriginal) {
     
      
      try {
        // Usamos el endpoint POST de tu servidor
        const urlServidor = "https://a.cuenticas.com/short"; 
        
        const opciones = {
          method: "post",
          contentType: "application/json",
          // Convertimos el objeto a string JSON para el body
          payload: JSON.stringify({ url: urlOriginal }), 
          muteHttpExceptions: true
        };
    
       
        const respuesta = UrlFetchApp.fetch(urlServidor, opciones);
        const code = respuesta.getResponseCode();
        const contenido = respuesta.getContentText();
    
       
    
        if (code >= 200 && code < 300) {
          const resJson = JSON.parse(contenido);
          if (resJson.noError) {
            return resJson.shortUrl;
          }
        }
        
        return null;
      } catch (e) {
       
        return null;
      }
    };

    // 2. Definimos extractor de Netflix Travel
    globalThis.getNetflixTravelCode = function(url) {
      var result = { noError: true };
      try {
        var options = {
          "method": "get",
          "muteHttpExceptions": true,
          "headers": {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36"
          }
        };

        var httpRes = UrlFetchApp.fetch(url, options);
        var responseCode = httpRes.getResponseCode();

        if (responseCode < 200 || responseCode >= 300) throw new Error("HTTP " + responseCode);

        var htmlRawText = httpRes.getContentText();
        var document = NodeHtmlParser.parse(htmlRawText);
        var codeElement = document.querySelector('[data-uia="travel-verification-otp"]');

        if (codeElement && codeElement.text) {
          result.code = codeElement.text.trim();
        } else {
          result.noError = false;
          result.errorMessage = "No se encontró el código";
        }
      } catch (error) {
        result.noError = false;
        result.errorMessage = error.toString();
      } finally {
        return result;
      }
    };

    // 3. Definimos procesador de links
    globalThis.processIfLink = function(result, context) {
      var isCode = result.code !== undefined;

      // Lógica Netflix Travel
      if (!isCode && context.netflixTravel) {
        try {
          console.log("✈️ Extrayendo código Netflix...");
          var travelResult = globalThis.getNetflixTravelCode(result.link);
          
          if (travelResult.noError) {
            delete result.link;
            result.code = travelResult.code;
            if (result.ifIsCodeAbout) {
              result.about = result.ifIsCodeAbout;
              delete result.ifIsCodeAbout;
            }
            isCode = true;
          }
        } catch (error) {
          console.warn('Error en Travel: ' + error.toString());
        }
      }

      // Lógica Acortador
      if (!isCode && result.link && !result.link.startsWith(globalThis.baseUrl)) {
        var shortenUrl = globalThis.shortUrl(result.link);
        
        if (shortenUrl !== null) {
          result.link = shortenUrl;

          if (context.netflixLinkTv) {
            var slug = shortenUrl.split("/").pop();
            result.link = "https://ntv.cuenticas.pro/#" + slug;
          }

          if (context.crunchyAprobarLink) {
            var slug = shortenUrl.split("/").pop();
            result.link = "https://ac.cuenticas.com/#" + slug;
          }
        }
      }
    };
  } else {
    console.log("Entorno no compatible con GAS.");
  }
})(); 

function verifyMax(root, respuesta, subject, context) {

    if (!(context?.from?.includes("no-reply@alerts.hbomax.com") || context?.from?.includes("hbomax@service.hbomax.com"))) {
      return respuesta;
    }
    
    context.keyword = "max";

    var regexSixNumberMax = /(?:^|\D)(\d{6})(?!\d)/;
    var normalizedSubject = String(subject || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
    var isOneTimeCodeSubject =
      normalizedSubject.includes("urgente: tu codigo de un solo uso de hbo max") ||
      (normalizedSubject.includes("tu codigo de un solo uso") && normalizedSubject.includes("hbo max")) ||
      normalizedSubject.includes("time sensitive: your one-time hbo max code") ||
      normalizedSubject.includes("one-time hbo max code");
    
    //if(subject.includes("Recuperación de contraseña") || subject.includes("Password recovery") ) return respuesta;
    //FORMATO CODIGO DE INICIO DE SESION EN LA WEB CON MAX:
    var emailHtml = root.querySelector("tr:nth-child(1) > td > p > span > b");
    var bodyText = root.querySelector("body")?.innerText || root.innerText || root.textContent || "";
    var textForCode = [emailHtml?.innerText?.trim(), bodyText].filter(Boolean).join("\n");
    var code = textForCode.match(regexSixNumberMax)?.[1];

    if (code && isOneTimeCodeSubject) {
        
        respuesta.noError = true;
        respuesta.code = code;
        respuesta.about = 'Codigo de verificacion Para Iniciar Sesion en Hbo Max'
        console.log("Es de max codigo de iniciar sesion");
        
        return respuesta
    }



    console.log("no es de Max");
    return respuesta;
}

function verifyMaxPassReset(root, respuesta, subject, context) {

    if (!(context?.from?.includes("no-reply@alerts.hbomax.com"))) {
      return respuesta;
    }
    
    context.keyword = "max";

    var regexSixNumberMax = /^\d{6}$/g;
    
    if(!(subject.includes("Tu enlace para restablecer tu contraseña requerido a las") || subject.includes("Your HBO Max Password Reset Link as of") )) return respuesta;
    //FORMATO CODIGO DE INICIO DE SESION EN LA WEB CON MAX:
   var btnElement = root.querySelector('a[href^="https://auth.hbomax.com/set-new-password?passwordResetToken="]');

    if (btnElement) {
        context.sendJustIf='{max-reset-pass}';
        console.log("Es de enlace para cambiar contraseña HBOMAX");
        
        respuesta.noError = true;
        respuesta.link = parseAttributes(btnElement)?.href || "";
        respuesta.about = 'Enlace para cambiar contraseña Hbomax'
        
        return respuesta
    }

    console.log("no es de Max");
    return respuesta;
}


function verifyNetflix(root, respuesta, context) {

  context.keyword = "netflix";

  if (context?.from?.includes("info@account.netflix.com") === false) {
    return respuesta;
  }

  var bodyHtml = root.querySelector("body")?.toString();
  //COMPROBAR QUE EN EL CONTENIDO DEL CORREO ESTE LA PALABRA "netflix" (mayusculas o como sea)
  if (!bodyHtml?.toLowerCase()?.includes("netflix")) return respuesta;

  var codeContainer = root.querySelector("table > tbody > tr > td > table > tbody > tr:nth-child(2) > td > table:nth-child(3) > tbody > tr > td");


  if (codeContainer && (bodyHtml.includes("Ingresa este código para iniciar sesión") || bodyHtml.includes("Enter this code to sign in") || bodyHtml.includes("Escribe este código para iniciar sesión"))) {
    console.log("Es codigo 4 digitos de inicio de sesión Netflix ")

    respuesta.noError = true;
    respuesta.code = codeContainer.innerText.trim();
    respuesta.about = "Codigo para iniciar sesión Netflix"
    return respuesta
  };


  //COMPROBAR SI ES ESTOY DE VIAJE


  var linkElementViaje = root.querySelector('a[href^="https://www.netflix.com/account/travel/verify?"]');
  if (linkElementViaje) {
    console.log("Es para estoy estoy de viaje netflix");

    var link = linkElementViaje?.attributes?.href?.trim();
    var profileInfoElement = root.querySelector('td.profile-info');
    var firstOptionTravel = "Solicitud de ";
    if (profileInfoElement?.innerText?.startsWith(firstOptionTravel)) {
      var profileName = profileInfoElement?.innerText.split(firstOptionTravel)[1]?.split("desde:")[0]?.trim();

      if (profileName) {
        console.log("Para perfil: " + profileName)
        context.noCredencialsRequired = true;
        context.profileName = profileName
      }
    }
    var secondOptionTravel = " ha enviado una solicitud desde ";

    if (profileInfoElement?.innerText?.includes(secondOptionTravel)) {
      var profileName = profileInfoElement?.innerText.split(secondOptionTravel)[0]?.trim();

      if (profileName) {
        console.log("Para perfil: " + profileName)
        context.noCredencialsRequired = true;
        context.profileName = profileName
      }
    }
    context.netflixTravel = true;
    respuesta.noError = true;
    respuesta.link = link;
    respuesta.ifIsCodeAbout = "Codigo Estoy de Viaje Netflix\n[Valido por 15 Min]"
    respuesta.about = "Enlace Codigo Estoy de Viaje Netflix\n[Valido por 15 Min]";
    return respuesta;
  }


  //COMPROBAR SI ES PARA ACTUALIZAR HOGAR
  var linkElement = root.querySelector('a[href^="https://www.netflix.com/account/update-primary-location?"]');
  if (linkElement) {
    console.log("Es para actualizar hogar netflix");

    var link = linkElement?.attributes?.href?.trim();

    var profileInfoElement = root.querySelector('td.profile-info');
    var firstOption = "Solicitud de ";
    if (profileInfoElement?.innerText?.startsWith(firstOption)) {
      var profileName = profileInfoElement?.innerText.split(firstOption)[1]?.split(",")[0]?.trim();

      if (profileName) {
        context.noCredencialsRequired = true;
        console.log("Para perfil: " + profileName)
        context.profileName = profileName
      }


    }
    var secondOption = " ha enviado una solicitud desde el dispositivo"
    if (profileInfoElement?.innerText?.includes(secondOption)) {
      var profileName = profileInfoElement?.innerText.split(secondOption)[0]?.trim();

      if (profileName) {
        context.noCredencialsRequired = true;
        console.log("Para perfil: " + profileName)
        context.profileName = profileName
      }


    }

    respuesta.noError = true;
    respuesta.link = link;
    respuesta.about = "Link para actualizar Hogar Netflix\n[Valido por 15 Min]";
    return respuesta;
  }

  //ENLACE DE APROBACION EN TV SMART

  var theLinkElement = root.querySelector('a[href^="https://www.netflix.com/ilum?code="]');
 
  var link = theLinkElement?.attributes?.href?.trim();

  if (bodyHtml.includes('Aprueba la nueva solicitud de inicio de sesión') && bodyHtml.includes("Tú o alguien que use tu cuenta ha solicitado un enlace de inicio de sesión.") && theLinkElement && link) {
    console.log("Es para enlace de aprobacion en Netflix TV");
    respuesta.noError = true;
    respuesta.link = link;
    respuesta.about = "Enlace de Aprobacion en TV - Netflix\n[Valido por 15 Min]";
    context.netflixLinkTv = true;
  }

  console.log("NO continuar con netflix")

  return respuesta;


}

function verifyDisney(root, respuesta, context) {
  const regexSixNumberMax = /^\d{6}$/g;

  // 1. Validar remitente
  const remitentesValidos = [
    "disneyplus@trx.mail2.disneyplus.com",
    "no-reply@my.disney.com"
  ];
  
  // Si el remitente NO está incluido en ninguna de las direcciones válidas
  if (!remitentesValidos.some(email => context?.from?.includes(email))) {
    return respuesta;
  }

  // 2. Buscar tabla
  const table = root.querySelector("table.module_1 table.module");
  if (!table) {
    console.log("No se encontró tabla Disney");
    return respuesta;
  }

  // 3. Buscar filas y tds con chequeo seguro
  const rows = table.querySelectorAll("tr") || [];
  const tds = [];
  rows.forEach(tr => {
    const td = tr.querySelector("td");
    if (td) tds.push(td);
  });

  // 4. Desestructurar con defaults
  const [labelElement = null, , codeElement = null] = tds;

  if (labelElement && codeElement) {
    const code = codeElement?.innerText?.trim();
    //const labelText = labelElement?.innerText?.trim();
    //const isLabelCodigo = labelText === "Tu código de acceso único para Disney+";

    if (code?.match(regexSixNumberMax)) {
      context.sendJustIf="{enviar_codigos_disney}"
      context.keyword = "disney";
      console.log("Es de código de acceso único para Disney+");
    
      respuesta.noError = true;
      respuesta.code = code;
      respuesta.about = "Código de acceso único Disney Plus (Válido por 15 min)";
    
      return respuesta;
    }
  }

  console.log("No es de Disney+");
  return respuesta;
}



function verifyCrunchyrollLogin(root, respuesta, subject, context) {
  if (context?.from?.includes("hello@info.crunchyroll.com") === false) {
    return respuesta;
  }
  var [thisWaMeBtn, thisWasNotMeBtn]= root.querySelectorAll('[style="border-radius: 0px; display: inline-block; mso-padding-alt: 0; background-color: #E05200 !important; color: #000000; font-size: 16px; font-weight: 400; text-decoration: none; border-collapse: collapse; mso-line-height-rule: exactly; padding: 10px 14px;"]')
    
  if(!(thisWaMeBtn && thisWasNotMeBtn && thisWaMeBtn.tagName === "A" && thisWasNotMeBtn.tagName === "A")) return respuesta;
  if(!(thisWaMeBtn.parentNode.parentNode === thisWasNotMeBtn.parentNode.parentNode)) return respuesta;
  if(!(thisWasNotMeBtn.parentNode?.tagName==='TD' && thisWasNotMeBtn.parentNode?.parentNode?.tagName==='TR' && thisWasNotMeBtn.parentNode?.parentNode?.parentNode?.tagName==='TABLE')){
  return respuesta;
  }

    if(thisWaMeBtn.attributes?.href?.trim().startsWith('https://links.mail.crunchyroll.com/ls/click?upn=') && thisWasNotMeBtn.attributes?.href?.trim().startsWith('https://links.mail.crunchyroll.com/ls/click?upn=')){
        context.keyword = "crunchyroll";
        respuesta.link = thisWaMeBtn.attributes.href.trim();
        respuesta.noError = true;
        respuesta.about = "Enlace de aprobacion de inicio de sesion, Crunchyroll"
        context.crunchyAprobarLink = true;
        return respuesta

    }


  return respuesta;
}


function verifyCrunchyPassReset(root, respuesta, subject, context) {

  if (!context?.from?.includes("hello@info.crunchyroll.com")) {
    return respuesta;
  }

  context.keyword = "crunchyroll";

  const SUBJECT_MATCHES = [
    "Restablece tu contraseña de Crunchyroll",
    "Reset Your Crunchyroll Password"
  ];

  if (!SUBJECT_MATCHES.some(txt => subject.includes(txt))) return respuesta;

  const BTN_TEXT_MATCHES = [
    "haz clic aquí",
    "click here"
  ];

  const btnElements = Array.from(
    root.querySelectorAll('a[href^="https://links.mail.crunchyroll.com/ls/click?"]')
  );

  const resetBtn = btnElements.find(e =>
    BTN_TEXT_MATCHES.some(txt =>
      e.textContent?.toLowerCase().includes(txt)
    )
  );

  if (resetBtn) {
    context.sendJustIf = "{crunchy-reset-pass}";
    respuesta.noError = true;
    respuesta.link = parseAttributes(resetBtn).href;
    respuesta.about = "Enlace para cambiar contraseña Crunchyroll";
    console.log("Es de enlace para cambiar contraseña Crunchyroll");
    return respuesta;
  }

  console.log("no es de Reset password crunchyroll");
  return respuesta;
}


function extractCode(htmlText, subject, context={}) {
    var respuesta = {
        noError: false,
        message: "No se encontro ningun codigo"
    }
  
    const root = NodeHtmlParser.parse(htmlText);

    // Normalizar emails
    const emailRegex = /<([^>]+)>|([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/;
    function extractEmail(str) {
        if (!str) return "";
        const match = str.match(emailRegex);
        return match ? (match[1] || match[2]) : "";
    }

    if (context.to) context.to = extractEmail(context.to);
    if (context.from) context.from = extractEmail(context.from);

    // --- Función interna para centralizar la salida ---
    // Esto asegura que si es GAS, procesamos el link antes de devolverlo
    const finalizar = (res) => {
        console.log("es de "+context.keyword)
        if (getEnvironment() === "GAS" && res.noError) {
            // Aquí se ejecutan las llamadas a is.gd o Netflix Travel
            processIfLink(res, context);
        }
        return res;
    };

    // VERIFICACIONES
    verifyDisney(root, respuesta, context);
    if (respuesta.noError) return finalizar(respuesta);

    verifyAmazon(root, respuesta, subject, context);
    if (respuesta.noError) return finalizar(respuesta);

    verifyNetflix(root, respuesta, context);
    if (respuesta.noError) return finalizar(respuesta);

    verifyMax(root, respuesta, subject, context);
    if (respuesta.noError) return finalizar(respuesta);

    verifyYoutube(root, respuesta, context);
    if (respuesta.noError) return finalizar(respuesta);

    verifyChatGpt(root, respuesta, subject, context);
    if (respuesta.noError) return finalizar(respuesta);

    verifyDisneyEmailChange(root, respuesta, subject, context);
    if (respuesta.noError) return finalizar(respuesta);

    verifyCrunchyrollLogin(root, respuesta, subject, context);
    if (respuesta.noError) return finalizar(respuesta);

    verifyMaxPassReset(root, respuesta, subject, context);
    if (respuesta.noError) return finalizar(respuesta);

    verifyCrunchyPassReset(root, respuesta, subject, context);
    if (respuesta.noError) return finalizar(respuesta);

    verfiyNetflixAccountChanges(root, respuesta, subject, context);
    if (respuesta.noError) return finalizar(respuesta);

    verifyAppleTv(root, respuesta, subject, context)
    if (respuesta.noError) return finalizar(respuesta);

    verifyVixSignInLink(root, respuesta, subject, context)
    if (respuesta.noError) return finalizar(respuesta);
    
  
    return respuesta; // Si llega aquí, noError es false
}



function parseAttributes(attrsStr) {
    if(!attrsStr) return null;
    const attrs = {};
    // Expresión regular que busca pares atributo="valor"
    const regex = /([\w:-]+)\s*=\s*"([^"]*)"/g;
    let match;
    while ((match = regex.exec(attrsStr)) !== null) {
        const key = match[1];
        const value = match[2];
        attrs[key] = value;
    }
    return attrs;
}

function timeAgo(date) {
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);

    const intervals = [
        { label: 'año', seconds: 31536000 },
        { label: 'mes', seconds: 2592000 },
        { label: 'día', seconds: 86400 },
        { label: 'hora', seconds: 3600 },
        { label: 'minuto', seconds: 60 }
    ];

    for (const interval of intervals) {
        const count = Math.floor(seconds / interval.seconds);
        if (count >= 1) {
            return `hace ${count} ${interval.label}${count !== 1 ? 's' : ''}`;
        }
    }
    return 'hace unos segundos';
}

/**
 * Función principal para procesar la solicitud POST.
 * Analiza únicamente el ÚLTIMO mensaje dirigido al usuario por cada hilo.
 */
function main(e) {
  var response = { noError: true };
  var theContact = null;

  try {
    // 1. Parseo de datos de entrada
    var userData = JSON.parse(e.postData.contents);
    var targetEmail = userData.emailToCheck.toLowerCase();
    theContact = userData.contact || null;

    // 2. Verificación de seguridad
    var verify = VerifyContactAndEmail(userData, e.masterKey);
    if (verify !== true) throw new Error(verify);

    // 3. Búsqueda en Gmail
    var searchQuery = 'to:' + targetEmail;
    var threads = GmailApp.search(searchQuery, 0, 15); 

    if (threads.length === 0) {
      throw new Error("No se encontraron hilos para " + targetEmail);
    }

    var codeResponse = null;
    var mensajeUsado = null;

    // 4. Bucle de Hilos (Threads)
    for (var t = 0; t < threads.length; t++) {
      var allMessages = threads[t].getMessages();
      
      // 1. .slice(-30) toma los últimos 30 mensajes (los más nuevos cronológicamente)
      // 2. .reverse() los voltea para que el índice [0] sea el último que llegó
      var messagesReverse = allMessages.slice(-100).reverse();

      // 5. Bucle de Mensajes dentro del hilo
      for (var m = 0; m < messagesReverse.length; m++) {
        var msg = messagesReverse[m];
        var toField = msg.getTo().toLowerCase();

        // CONDICIÓN: ¿El mensaje es para esta cuenta?
        if (toField.includes(targetEmail)) {
          
          var htmlContent = msg.getBody();
          var subject = msg.getSubject();
          var context = { to: targetEmail, from: msg.getFrom(), subject: subject };

          // Intentamos extraer el código
          var result = extractCode(htmlContent, subject, context);
          
          if (result && result.noError) {
            codeResponse = result;
            mensajeUsado = msg;
          } else {
            console.log("El último mensaje del hilo " + (t + 1) + " no era válido. Saltando al siguiente hilo...");
          }

          // AQUI ESTÁ EL CAMBIO:
          // Una vez encontrado el mensaje dirigido al correo (sea válido el código o no),
          // rompemos el bucle de mensajes para no mirar más atrás en este hilo.
          break; 
        }
      }

      // Si ya encontramos un código exitoso en el último mensaje de algún hilo, dejamos de buscar en otros hilos
      if (codeResponse) break;
    }

    // 6. Validación final de resultados
    if (!codeResponse) {
      throw new Error("No se encontró código válido en el mensaje más reciente de los " + threads.length + " hilos analizados.");
    }

    // 7. Preparación de la respuesta
    var dateObj = mensajeUsado.getDate();
    response.estimatedTimeAgo =
      dateObj.toLocaleTimeString('es-CO', { hour12: true }) +
      " - " +
      dateObj.toLocaleDateString("es-CO") +
      "\n" +
      timeAgo(dateObj);

    response = Object.assign(response, codeResponse);
 

    
    if(context.profileName) response.profileName = context.profileName;
    response.contact = theContact;

  } catch (err) {
    console.log("Error en main: " + err.message);
    response.noError = false;
    response.message = err.message;
    response.contact = theContact;
  }

  return ContentService
    .createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON);
}

function VerifyContactAndEmail(userData, masterKey) {
    try {
        theContact = userData.contact;

        // 👑 VALIDACIÓN SUPERADMIN
        if (masterKey && userData.contact === masterKey) {
            theContact = "👑 MODO SUPERADMIN";
            console.log("Acceso autorizado vía Master Key");
            return true;
        }

        // --- CARGA DE DATOS DESDE SHEETS ---
        var fetchedData = UrlFetchApp.fetch(LINK_LIBRERIA).getContentText();
        var [clients, platforms] = JSON.parse(fetchedData).sheetsData;
        var targetEmail = userData.emailToCheck.toLowerCase();

        // ---------------------------------------------------------
        // LÓGICA NUEVA: Solo si viene la variable 'wa'
        // ---------------------------------------------------------
        if (userData.wa) {
            console.log("Ejecutando lógica multi-contacto (wa detectado)");
            
            // 1. Filtrar todos los clientes con ese número activos
            var activeClients = clients.data.filter(c => c.contact === userData.contact && c.active === "1");
            if (activeClients.length === 0) throw new Error("Contacto no encontrado o inactivo.");

            // 2. Buscar plataformas de esos clientes que coincidan con el email
            var clientIds = activeClients.map(c => c.id);
            var userPlatforms = platforms.data.filter(p => clientIds.includes(p.clientId) && p.email.toLowerCase().trim() === targetEmail.toLowerCase().trim());
            if (userPlatforms.length === 0) throw new Error("Correo " + userData.emailToCheck + " no asociado a este contacto.");

            // 3. Validar permisos de la plataforma encontrada
            var validPlatform = userPlatforms.find(p => p.active === "1" && p.withCredentials === "1");
            if (validPlatform) {
                var owner = activeClients.find(c => c.id === validPlatform.clientId);
                theContact = owner.name + " (" + userData.contact + ")";
                return true;
            } else {
                throw new Error("La cuenta no está activa o no tiene permisos de acceso.");
            }
        } 
        
        // ---------------------------------------------------------
        // LÓGICA ANTERIOR: Si NO viene la variable 'wa'
        // ---------------------------------------------------------
        else {

            console.log("Ejecutando lógica estándar (sin wa)");

            // Buscamos el primer índice que coincida (comportamiento original)
            // Intentamos buscar por emailContact primero
            // Buscamos de forma segura en emailContact
            var contactIndex = clients.data.map(e => (e.emailContact || "").toLowerCase()).indexOf(userData.contact.toLowerCase());
            
            // Si no lo encuentra, buscamos en el contact normal
            if (contactIndex === -1) {
                contactIndex = clients.data.map(e => (e.contact || "").toLowerCase()).indexOf(userData.contact.toLowerCase());
            }

            
            if (contactIndex >= 0 && clients.data[contactIndex].active === "1") {
                theContact = clients.data[contactIndex].name + " (" + theContact + ")";
                
                var userPlatforms = platforms.data.filter(e => e.clientId === clients.data[contactIndex].id);
                var platformIndex = userPlatforms.map(p => p.email.toLowerCase().trim()).indexOf(targetEmail.toLowerCase().trim());
                if (platformIndex >= 0) {
                    var plat = userPlatforms[platformIndex];
                    if (plat.active === "1" && plat.withCredentials === "1") {
                        return true;
                    } else {
                        throw new Error("El usuario no tiene acceso o la cuenta no está activa.");
                    }
                } else {
                    throw new Error("El usuario no tiene cuentas con este correo.");
                }
            } else {
                throw new Error("El usuario no está activo o no existe.");
            }
        }

    } catch (err) {
        console.log("Error en Verificación: " + err.message);
        return err.message;
    }
}

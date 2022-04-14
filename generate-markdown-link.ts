#!/usr/bin/env node

import "@jxa/global-type";
import { run } from "@jxa/run";
import { StandardAdditions } from "@jxa/types";
import { GoogleChrome as Chrome } from "./Chrome";

const originalClipboard = process.env.fakeClipboard;

run((originalClipboard) => {
  // Setup
  const chrome = Application<Chrome>("Google Chrome");
  chrome.includeStandardAdditions = true;
  const app = Application.currentApplication();
  app.includeStandardAdditions = true;

  const activeTab = chrome.windows[0].activeTab;
  let { url: urlFunc, title: tabTitle } = activeTab;
  const url = urlFunc();

  return generate();
  // Can do this again if we need to, but just makes things more confusing if not needed
  // try {
  //   return generate();
  // } catch {
  //   try {
  //     return generate();
  //   } catch (e) {
  //     console.log("Tried again, didn't work");
  //     throw e;
  //   }
  // }

  function generate() {
    let selection = copyChromeSelection({ activeTab, chrome, app });
    // Sometimes we get a false negative here. So we're naively going to just try again, just to make sure
    if (!selection) {
      delay(0.1);
      selection = copyChromeSelection({ activeTab, chrome, app });
    }

    let retVal;
    // FIXME: Used to be `query`, return it to that if we ever need this functionality again
    const givenTitle = null;
    console.log("selection:", selection);

    if (givenTitle) {
      retVal = `[${givenTitle}](${url})`;
    } else if (selection) {
      // If using a selection, write it in plain text and note the source as a link at the end
      const selectedText = normalizeSelection(selection);
      console.log("selectedText:", selectedText);

      getTextFragmentLink(activeTab);
      console.log(`🟡 🟡 🟡 delaying...`);
      delay(0.05);
      console.log(`🟡 🟡 🟡 done delaying`);
      const textFragmentLink = chrome.theClipboard();
      console.log("link:", textFragmentLink);

      const labelLink = parseBareDomain(url);
      console.log("labelLink:", labelLink);

      retVal = `${selectedText} ([${labelLink}](${textFragmentLink}))`;

      // There's a known bug with Notion (that they've told me they won't address), where they seem to strip a character after a Markdown link if the link ends with `.`. Which happens a lot with text fragment links. So we just add an extra paren
      //// This is fixed now..?
      // if (textFragmentLink.endsWith(".") && !textFragmentLink.endsWith(")")) {
      //   console.log("Notion bug: Adding an extra paren");
      //   retVal += ")";
      // }

      console.log("retVal:", retVal);
    } else {
      // If just copying the URL, use the title as the MD link title
      const title = tabTitle();

      retVal = `[${title}](${url})`;

      // There's a known bug with Notion (that they've told me they won't address), where they seem to strip a character after a Markdown link if the link ends with `.`. Which happens a lot with text fragment links. So we just add an extra paren
      if (url.endsWith(".")) {
        console.log("Notion bug: Adding an extra paren");
        retVal += ")";
      }
    }

    return retVal;
  }

  function parseBareDomain(url: string) {
    const { parseDomain, fromUrl } = importParseDomain();
    // @ts-ignore
    const parseResult = parseDomain(fromUrl(url));
    console.log("parseResult", JSON.stringify(parseResult, null, 2));
    // @ts-ignore
    return `${parseResult.domain}.${parseResult.topLevelDomains.join(".")}`;
  }

  function copyChromeSelection({
    activeTab,
    chrome,
    app,
  }: {
    activeTab: Chrome.Tab;
    chrome: Chrome;
    app: StandardAdditions.StandardAdditions;
  }) {
    // Copy the current chrome selection to the clipboard
    chrome.copySelection(activeTab);
    let selection = "";
    try {
      selection = app.theClipboard();
    } catch (e) {
      console.log("getting Chrome clipboard throwing an error");
      throw e;
    }
    console.log("clipboard after trying to copy:", JSON.stringify(selection));

    // Determine if Chrome actually had a selection by seeing if the clipboard is still the original fake we set in Alfred
    const chromeHasSelection = !!selection && selection !== originalClipboard;
    console.log("chromeHasSelection", chromeHasSelection);

    return chromeHasSelection ? selection : false;
  }

  function capitalizeFirstLetter(string: string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }

  function normalizeSelection(selection: string) {
    return capitalizeFirstLetter(
      selection
        .trim()
        .replace(/(?:\r\n|\r|\n)/g, " ")
        // Healthline "trusted" checkmark
        .replace("Trusted Source", "")
    );
  }

  /********************************************************************
   * Reference
   *******************************************************************/

  // Old way of grabbing original clipboard, before we figured out we could do that with Alfred itself
  // Grab the original clipboard for reference
  // Seems like `systemEvents.theClipboard()` throws an error when we got something complex in the clipboard that it can't handle. So we assign it to this garbage string here. And then if it throws, we swallow the error, and check later if it's still the garbage string. If it is, then we just treat it as some weird thing that was in the clipboard, and ignore it
  // let originalClipboard = 'must_be_an_object'
  // try {
  //   originalClipboard = systemEvents.theClipboard() || ''
  // } catch (e) {
  //   console.log('originalClipboard throwing an error')
  //   console.log(e)
  // }

  //  ObjC.import('stdlib');
  //  const originalClipboard = $.getenv('originalClipboard');
  //  console.log("originalClipboard:", originalClipboard)

  /********************************************************************
   * Hairy
   *******************************************************************/

  /**************************************
   * Code from the `parse-domain` library
   *
   * (modified where necessary)
   *************************************/

  function importParseDomain() {
    // node_modules/parse-domain/build/sanitize.js
    var LABEL_SEPARATOR = ".";
    var LABEL_LENGTH_MIN = 1;
    var LABEL_LENGTH_MAX = 63;
    var DOMAIN_LENGTH_MAX = 253;
    // var textEncoder = new TextEncoder();
    // @ts-ignore
    var Validation;
    (function (Validation2) {
      // @ts-ignore
      Validation2["Lax"] = "LAX";
      // @ts-ignore
      Validation2["Strict"] = "STRICT";
    })(Validation || (Validation = {}));
    // @ts-ignore
    var ValidationErrorType;
    (function (ValidationErrorType2) {
      // @ts-ignore
      ValidationErrorType2["NoHostname"] = "NO_HOSTNAME";
      // @ts-ignore
      // @ts-ignore
      ValidationErrorType2["DomainMaxLength"] = "DOMAIN_MAX_LENGTH";
      // @ts-ignore
      ValidationErrorType2["LabelMinLength"] = "LABEL_MIN_LENGTH";
      // @ts-ignore
      ValidationErrorType2["LabelMaxLength"] = "LABEL_MAX_LENGTH";
      // @ts-ignore
      ValidationErrorType2["LabelInvalidCharacter"] = "LABEL_INVALID_CHARACTER";
      // @ts-ignore
      ValidationErrorType2["LastLabelInvalid"] = "LAST_LABEL_INVALID";
    })(ValidationErrorType || (ValidationErrorType = {}));
    // @ts-ignore
    var SanitizationResultType;
    (function (SanitizationResultType2) {
      // @ts-ignore
      SanitizationResultType2["ValidIp"] = "VALID_IP";
      // @ts-ignore
      SanitizationResultType2["ValidDomain"] = "VALID_DOMAIN";
      // @ts-ignore
      SanitizationResultType2["Error"] = "ERROR";
    })(SanitizationResultType || (SanitizationResultType = {}));
    // @ts-ignore
    var createNoHostnameError = (input) => {
      return {
        // @ts-ignore
        type: ValidationErrorType.NoHostname,
        message: `The given input ${String(
          input
        )} does not look like a hostname.`,
        column: 1,
      };
    };
    // @ts-ignore
    var createDomainMaxLengthError = (domain, length) => {
      return {
        // @ts-ignore
        type: ValidationErrorType.DomainMaxLength,
        message: `Domain "${domain}" is too long. Domain is ${length} octets long but should not be longer than ${DOMAIN_LENGTH_MAX}.`,
        column: length,
      };
    };
    // @ts-ignore
    var createLabelMinLengthError = (label, column) => {
      const length = label.length;
      return {
        // @ts-ignore
        type: ValidationErrorType.LabelMinLength,
        message: `Label "${label}" is too short. Label is ${length} octets long but should be at least ${LABEL_LENGTH_MIN}.`,
        column,
      };
    };
    // @ts-ignore
    var createLabelMaxLengthError = (label, column) => {
      const length = label.length;
      return {
        // @ts-ignore
        type: ValidationErrorType.LabelMaxLength,
        message: `Label "${label}" is too long. Label is ${length} octets long but should not be longer than ${LABEL_LENGTH_MAX}.`,
        column,
      };
    };
    var createLabelInvalidCharacterError = (
      // @ts-ignore
      label,
      // @ts-ignore
      // @ts-ignore
      invalidCharacter,
      // @ts-ignore
      column
    ) => {
      return {
        // @ts-ignore
        type: ValidationErrorType.LabelInvalidCharacter,
        message: `Label "${label}" contains invalid character "${invalidCharacter}" at column ${column}.`,
        column,
      };
    };
    // @ts-ignore
    var createLastLabelInvalidError = (label, column) => {
      return {
        // @ts-ignore
        type: ValidationErrorType.LabelInvalidCharacter,
        message: `Last label "${label}" must not be all-numeric.`,
        column,
      };
    };
    // @ts-ignore
    var sanitize = (input, options = {}) => {
      if (typeof input !== "string") {
        return {
          // @ts-ignore
          type: SanitizationResultType.Error,
          errors: [createNoHostnameError(input)],
        };
      }
      if (input === "") {
        return {
          // @ts-ignore
          type: SanitizationResultType.ValidDomain,
          domain: input,
          labels: [],
        };
      }
      const inputTrimmedAsIp = input.replace(/^\[|]$/g, "");
      // @ts-ignore
      // const ipVersionOfInput = ipVersion(inputTrimmedAsIp);
      // if (ipVersionOfInput !== void 0) {
      //   return {
      // // @ts-ignore
      //     type: SanitizationResultType.ValidIp,
      //     ip: inputTrimmedAsIp,
      //     ipVersion: ipVersionOfInput,
      //   };
      // }
      const lastChar = input.charAt(input.length - 1);
      const canonicalInput =
        lastChar === LABEL_SEPARATOR ? input.slice(0, -1) : input;
      // const octets = new TextEncoder().encode(canonicalInput);
      // if (octets.length > DOMAIN_LENGTH_MAX) {
      //   return {
      //     type: SanitizationResultType.Error,
      //     errors: [createDomainMaxLengthError(input, octets.length)],
      //   };
      // }
      const labels = canonicalInput.split(LABEL_SEPARATOR);
      // @ts-ignore
      const { validation = Validation.Strict } = options;
      const labelValidationErrors = validateLabels[validation](labels);
      if (labelValidationErrors.length > 0) {
        return {
          // @ts-ignore
          type: SanitizationResultType.Error,
          errors: labelValidationErrors,
        };
      }
      return {
        // @ts-ignore
        type: SanitizationResultType.ValidDomain,
        domain: input,
        labels,
      };
    };
    var validateLabels = {
      // @ts-ignore
      [Validation.Lax]: (labels) => {
        return [];
        // const labelValidationErrors = [];
        // let column = 1;
        // for (const label of labels) {
        //   const octets = textEncoder.encode(label);
        //   if (octets.length < LABEL_LENGTH_MIN) {
        //     labelValidationErrors.push(
        //       createLabelMinLengthError(label, column)
        //     );
        //   } else if (octets.length > LABEL_LENGTH_MAX) {
        //     labelValidationErrors.push(
        //       createLabelMaxLengthError(label, column)
        //     );
        //   }
        //   column += label.length + LABEL_SEPARATOR.length;
        // }
        // return labelValidationErrors;
      },
      // @ts-ignore
      [Validation.Strict]: (labels) => {
        const labelValidationErrors = [];
        let column = 1;
        let lastLabel;
        for (const label of labels) {
          const invalidCharacter = /[^\da-z-]/i.exec(label);
          if (invalidCharacter) {
            labelValidationErrors.push(
              createLabelInvalidCharacterError(
                label,
                invalidCharacter[0],
                invalidCharacter.index + 1
              )
            );
          }
          if (label.startsWith("-")) {
            labelValidationErrors.push(
              createLabelInvalidCharacterError(label, "-", column)
            );
          } else if (label.endsWith("-")) {
            labelValidationErrors.push(
              createLabelInvalidCharacterError(
                label,
                "-",
                column + label.length - 1
              )
            );
          }
          if (label.length < LABEL_LENGTH_MIN) {
            labelValidationErrors.push(
              createLabelMinLengthError(label, column)
            );
          } else if (label.length > LABEL_LENGTH_MAX) {
            labelValidationErrors.push(
              createLabelMaxLengthError(label, column)
            );
          }
          column += label.length + LABEL_SEPARATOR.length;
          lastLabel = label;
        }
        if (lastLabel !== void 0 && /[a-z-]/iu.test(lastLabel) === false) {
          labelValidationErrors.push(
            createLastLabelInvalidError(
              lastLabel,
              column - lastLabel.length - LABEL_SEPARATOR.length
            )
          );
        }
        return labelValidationErrors;
      },
    };

    // node_modules/parse-domain/build/trie/nodes.js
    var NODE_TYPE_ROOT = Symbol("ROOT");
    var NODE_TYPE_CHILD = Symbol("CHILD");
    var createRootNode = () => {
      return {
        type: NODE_TYPE_ROOT,
        children: /* @__PURE__ */ new Map(),
      };
    };
    // @ts-ignore
    var createOrGetChild = (parent, label) => {
      let child = parent.children.get(label);
      if (child === void 0) {
        child = {
          type: NODE_TYPE_CHILD,
          label,
          children: /* @__PURE__ */ new Map(),
          parent,
        };
        parent.children.set(label, child);
      }
      return child;
    };

    // node_modules/parse-domain/build/trie/parse-trie.js
    // @ts-ignore
    var parseTrie = (serializedTrie) => {
      const rootNode = createRootNode();
      let domain = "";
      let parentNode = rootNode;
      let node = rootNode;
      const addDomain = () => {
        node = createOrGetChild(parentNode, domain);
        domain = "";
      };
      for (let i = 0; i < serializedTrie.length; i++) {
        const char = serializedTrie.charAt(i);
        switch (char) {
          case SAME: {
            addDomain();
            continue;
          }
          case DOWN: {
            addDomain();
            parentNode = node;
            continue;
          }
          case RESET: {
            addDomain();
            parentNode = rootNode;
            continue;
          }
          case UP: {
            if (parentNode.type === NODE_TYPE_ROOT) {
              throw new Error(
                `Error in serialized trie at position ${i}: Cannot go up, current parent node is already root`
              );
            }
            addDomain();
            // @ts-ignore
            parentNode = parentNode.parent;
            continue;
          }
        }
        domain += char;
      }
      if (domain !== "") {
        addDomain();
      }
      return rootNode;
    };

    // node_modules/parse-domain/build/parse-domain.js
    var RESERVED_TOP_LEVEL_DOMAINS = [
      "localhost",
      "local",
      "example",
      "invalid",
      "test",
    ];
    // @ts-ignore
    var ParseResultType;
    (function (ParseResultType2) {
      // @ts-ignore
      ParseResultType2["Invalid"] = "INVALID";
      // @ts-ignore
      // @ts-ignore
      ParseResultType2["Ip"] = "IP";
      // @ts-ignore
      ParseResultType2["Reserved"] = "RESERVED";
      // @ts-ignore
      ParseResultType2["NotListed"] = "NOT_LISTED";
      // @ts-ignore
      ParseResultType2["Listed"] = "LISTED";
    })(ParseResultType || (ParseResultType = {}));
    // @ts-ignore
    var getAtIndex = (array, index) => {
      return index >= 0 && index < array.length ? array[index] : void 0;
    };
    // @ts-ignore
    var splitLabelsIntoDomains = (labels, index) => {
      return {
        subDomains: labels.slice(0, Math.max(0, index)),
        domain: getAtIndex(labels, index),
        topLevelDomains: labels.slice(index + 1),
      };
    };
    // @ts-ignore
    var parsedIcannTrie;
    // @ts-ignore
    var parsedPrivateTrie;
    // @ts-ignore
    var parseDomain = (hostname, options) => {
      const sanitizationResult = sanitize(hostname, options);
      // @ts-ignore
      if (sanitizationResult.type === SanitizationResultType.Error) {
        return {
          // @ts-ignore
          type: ParseResultType.Invalid,
          hostname,
          errors: sanitizationResult.errors,
        };
      }
      // @ts-ignore
      // if (sanitizationResult.type === SanitizationResultType.ValidIp) {
      //   return {
      // // @ts-ignore
      //     type: ParseResultType.Ip,
      //     hostname: sanitizationResult.ip,
      //     ipVersion: sanitizationResult.ipVersion,
      //   };
      // }
      const { labels, domain } = sanitizationResult;
      if (
        hostname === "" ||
        // @ts-ignore
        RESERVED_TOP_LEVEL_DOMAINS.includes(labels[labels.length - 1])
      ) {
        return {
          // @ts-ignore
          type: ParseResultType.Reserved,
          hostname: domain,
          labels,
        };
      }
      parsedIcannTrie =
        // @ts-ignore
        parsedIcannTrie !== null && parsedIcannTrie !== void 0
          ? // @ts-ignore
            parsedIcannTrie
          : parseTrie(icann_default);
      parsedPrivateTrie =
        // @ts-ignore
        parsedPrivateTrie !== null && parsedPrivateTrie !== void 0
          ? // @ts-ignore
            parsedPrivateTrie
          : parseTrie(private_default);
      const icannTlds = lookUpTldsInTrie(labels, parsedIcannTrie);
      const privateTlds = lookUpTldsInTrie(labels, parsedPrivateTrie);
      if (icannTlds.length === 0 && privateTlds.length === 0) {
        return {
          // @ts-ignore
          type: ParseResultType.NotListed,
          hostname: domain,
          labels,
        };
      }
      const indexOfPublicSuffixDomain =
        // @ts-ignore
        labels.length - Math.max(privateTlds.length, icannTlds.length) - 1;
      // @ts-ignore
      const indexOfIcannDomain = labels.length - icannTlds.length - 1;
      return Object.assign(
        {
          // @ts-ignore
          type: ParseResultType.Listed,
          hostname: domain,
          labels,
          icann: splitLabelsIntoDomains(labels, indexOfIcannDomain),
        },
        splitLabelsIntoDomains(labels, indexOfPublicSuffixDomain)
      );
    };

    // node_modules/parse-domain/build/from-url.js
    var urlPattern = /^[a-z][*+.a-z-]+:\/\//i;
    var invalidIpv6Pattern =
      /^([a-z][*+.a-z-]+:\/\/)([^[].*:[^/?]*:[^/?]*)(.*)/i;
    var NO_HOSTNAME = Symbol("NO_HOSTNAME");
    // @ts-ignore
    // var fromUrl = (urlLike) => {
    //   if (typeof URL !== "function") {
    //     throw new Error(
    //       "Looks like the new URL() constructor is not globally available in your environment. Please make sure to use a polyfill."
    //     );
    //   }
    //   if (typeof urlLike !== "string") {
    //     return NO_HOSTNAME;
    //   }
    //   let url = urlLike.startsWith("//")
    //     ? `http:${urlLike}`
    //     : urlLike.startsWith("/")
    //     ? urlLike
    //     : urlPattern.test(urlLike)
    //     ? urlLike
    //     : `http://${urlLike}`;
    //   url = url.replace(invalidIpv6Pattern, "$1[$2]$3");
    //   try {
    //     console.log("new URL", url);

    //     return new URL(url).hostname;
    //   } catch (_a) {
    //     return NO_HOSTNAME;
    //   }
    // };

    // node_modules/parse-domain/serialized-tries/icann.js
    var icann_default =
      "ac>com,edu,gov,net,mil,org<ad>nom<ae>co,net,org,sch,ac,gov,mil<aero>accident-investigation,accident-prevention,aerobatic,aeroclub,aerodrome,agents,aircraft,airline,airport,air-surveillance,airtraffic,air-traffic-control,ambulance,amusement,association,author,ballooning,broker,caa,cargo,catering,certification,championship,charter,civilaviation,club,conference,consultant,consulting,control,council,crew,design,dgca,educator,emergency,engine,engineer,entertainment,equipment,exchange,express,federation,flight,fuel,gliding,government,groundhandling,group,hanggliding,homebuilt,insurance,journal,journalist,leasing,logistics,magazine,maintenance,media,microlight,modelling,navigation,parachuting,paragliding,passenger-association,pilot,press,production,recreation,repbody,res,research,rotorcraft,safety,scientist,services,show,skydiving,software,student,trader,trading,trainer,union,workinggroup,works<af>gov,com,org,net,edu<ag>com,org,net,co,nom<ai>off,com,net,org<al>com,edu,gov,mil,net,org<am>co,com,commune,net,org<ao>ed,gv,og,co,pb,it<aq,ar>bet,com,coop,edu,gob,gov,int,mil,musica,mutual,net,org,senasa,tur<arpa>e164,in-addr,ip6,iris,uri,urn<as>gov<asia,at>ac>sth<co,gv,or<au>com,net,org,edu>act,catholic,nsw>schools<nt,qld,sa,tas,vic,wa<gov>qld,sa,tas,vic,wa<asn,id,info,conf,oz,act,nsw,nt,qld,sa,tas,vic,wa<aw>com<ax,az>com,net,int,gov,org,edu,info,pp,mil,name,pro,biz<ba>com,edu,gov,mil,net,org<bb>biz,co,com,edu,gov,info,net,org,store,tv<bd>*<be>ac<bf>gov<bg>a,b,c,d,e,f,g,h,i,j,k,l,m,n,o,p,q,r,s,t,u,v,w,x,y,z,0,1,2,3,4,5,6,7,8,9<bh>com,edu,net,org,gov<bi>co,com,edu,or,org<biz,bj>asso,barreau,gouv<bm>com,edu,gov,net,org<bn>com,edu,gov,net,org<bo>com,edu,gob,int,org,net,mil,tv,web,academia,agro,arte,blog,bolivia,ciencia,cooperativa,democracia,deporte,ecologia,economia,empresa,indigena,industria,info,medicina,movimiento,musica,natural,nombre,noticias,patria,politica,profesional,plurinacional,pueblo,revista,salud,tecnologia,tksat,transporte,wiki<br>9guacu,abc,adm,adv,agr,aju,am,anani,aparecida,app,arq,art,ato,b,barueri,belem,bhz,bib,bio,blog,bmd,boavista,bsb,campinagrande,campinas,caxias,cim,cng,cnt,com,contagem,coop,coz,cri,cuiaba,curitiba,def,des,det,dev,ecn,eco,edu,emp,enf,eng,esp,etc,eti,far,feira,flog,floripa,fm,fnd,fortal,fot,foz,fst,g12,geo,ggf,goiania,gov>ac,al,am,ap,ba,ce,df,es,go,ma,mg,ms,mt,pa,pb,pe,pi,pr,rj,rn,ro,rr,rs,sc,se,sp,to<gru,imb,ind,inf,jab,jampa,jdf,joinville,jor,jus,leg,lel,log,londrina,macapa,maceio,manaus,maringa,mat,med,mil,morena,mp,mus,natal,net,niteroi,nom>*<not,ntr,odo,ong,org,osasco,palmas,poa,ppg,pro,psc,psi,pvh,qsl,radio,rec,recife,rep,ribeirao,rio,riobranco,riopreto,salvador,sampa,santamaria,santoandre,saobernardo,saogonca,seg,sjc,slg,slz,sorocaba,srv,taxi,tc,tec,teo,the,tmp,trd,tur,tv,udi,vet,vix,vlog,wiki,zlg<bs>com,net,org,edu,gov<bt>com,edu,gov,net,org<bv,bw>co,org<by>gov,mil,com,of<bz>com,net,org,edu,gov<ca>ab,bc,mb,nb,nf,nl,ns,nt,nu,on,pe,qc,sk,yk,gc<cat,cc,cd>gov<cf,cg,ch,ci>org,or,com,co,edu,ed,ac,net,go,asso,xn--aroport-bya,int,presse,md,gouv<ck>*,!www<cl>co,gob,gov,mil<cm>co,com,gov,net<cn>ac,com,edu,gov,net,org,mil,xn--55qx5d,xn--io0a7i,xn--od0alg,ah,bj,cq,fj,gd,gs,gz,gx,ha,hb,he,hi,hl,hn,jl,js,jx,ln,nm,nx,qh,sc,sd,sh,sn,sx,tj,xj,xz,yn,zj,hk,mo,tw<co>arts,com,edu,firm,gov,info,int,mil,net,nom,org,rec,web<com,coop,cr>ac,co,ed,fi,go,or,sa<cu>com,edu,org,net,gov,inf<cv>com,edu,int,nome,org<cw>com,edu,net,org<cx>gov<cy>ac,biz,com,ekloges,gov,ltd,name,net,org,parliament,press,pro,tm<cz,de,dj,dk,dm>com,net,org,edu,gov<do>art,com,edu,gob,gov,mil,net,org,sld,web<dz>art,asso,com,edu,gov,org,net,pol,soc,tm<ec>com,info,net,fin,k12,med,pro,org,edu,gov,gob,mil<edu,ee>edu,gov,riik,lib,med,com,pri,aip,org,fie<eg>com,edu,eun,gov,mil,name,net,org,sci<er>*<es>com,nom,org,gob,edu<et>com,gov,org,edu,biz,name,info,net<eu,fi>aland<fj>ac,biz,com,gov,info,mil,name,net,org,pro<fk>*<fm>com,edu,net,org<fo,fr>asso,com,gouv,nom,prd,tm,aeroport,avocat,avoues,cci,chambagri,chirurgiens-dentistes,experts-comptables,geometre-expert,greta,huissier-justice,medecin,notaires,pharmacien,port,veterinaire<ga,gb,gd>edu,gov<ge>com,edu,gov,org,mil,net,pvt<gf,gg>co,net,org<gh>com,edu,gov,org,mil<gi>com,ltd,gov,mod,edu,org<gl>co,com,edu,net,org<gm,gn>ac,com,edu,gov,org,net<gov,gp>com,net,mobi,edu,org,asso<gq,gr>com,edu,net,org,gov<gs,gt>com,edu,gob,ind,mil,net,org<gu>com,edu,gov,guam,info,net,org,web<gw,gy>co,com,edu,gov,net,org<hk>com,edu,gov,idv,net,org,xn--55qx5d,xn--wcvs22d,xn--lcvr32d,xn--mxtq1m,xn--gmqw5a,xn--ciqpn,xn--gmq050i,xn--zf0avx,xn--io0a7i,xn--mk0axi,xn--od0alg,xn--od0aq3b,xn--tn0ag,xn--uc0atv,xn--uc0ay4a<hm,hn>com,edu,org,net,mil,gob<hr>iz,from,name,com<ht>com,shop,firm,info,adult,net,pro,org,med,art,coop,pol,asso,edu,rel,gouv,perso<hu>co,info,org,priv,sport,tm,2000,agrar,bolt,casino,city,erotica,erotika,film,forum,games,hotel,ingatlan,jogasz,konyvelo,lakas,media,news,reklam,sex,shop,suli,szex,tozsde,utazas,video<id>ac,biz,co,desa,go,mil,my,net,or,ponpes,sch,web<ie>gov<il>ac,co,gov,idf,k12,muni,net,org<im>ac,co>ltd,plc<com,net,org,tt,tv<in>co,firm,net,org,gen,ind,nic,ac,edu,res,gov,mil<info,int>eu<io>com<iq>gov,edu,mil,com,org,net<ir>ac,co,gov,id,net,org,sch,xn--mgba3a4f16a,xn--mgba3a4fra<is>net,com,edu,gov,org,int<it>gov,edu,abr,abruzzo,aosta-valley,aostavalley,bas,basilicata,cal,calabria,cam,campania,emilia-romagna,emiliaromagna,emr,friuli-v-giulia,friuli-ve-giulia,friuli-vegiulia,friuli-venezia-giulia,friuli-veneziagiulia,friuli-vgiulia,friuliv-giulia,friulive-giulia,friulivegiulia,friulivenezia-giulia,friuliveneziagiulia,friulivgiulia,fvg,laz,lazio,lig,liguria,lom,lombardia,lombardy,lucania,mar,marche,mol,molise,piedmont,piemonte,pmn,pug,puglia,sar,sardegna,sardinia,sic,sicilia,sicily,taa,tos,toscana,trentin-sud-tirol,xn--trentin-sd-tirol-rzb,trentin-sudtirol,xn--trentin-sdtirol-7vb,trentin-sued-tirol,trentin-suedtirol,trentino-a-adige,trentino-aadige,trentino-alto-adige,trentino-altoadige,trentino-s-tirol,trentino-stirol,trentino-sud-tirol,xn--trentino-sd-tirol-c3b,trentino-sudtirol,xn--trentino-sdtirol-szb,trentino-sued-tirol,trentino-suedtirol,trentino,trentinoa-adige,trentinoaadige,trentinoalto-adige,trentinoaltoadige,trentinos-tirol,trentinostirol,trentinosud-tirol,xn--trentinosd-tirol-rzb,trentinosudtirol,xn--trentinosdtirol-7vb,trentinosued-tirol,trentinosuedtirol,trentinsud-tirol,xn--trentinsd-tirol-6vb,trentinsudtirol,xn--trentinsdtirol-nsb,trentinsued-tirol,trentinsuedtirol,tuscany,umb,umbria,val-d-aosta,val-daosta,vald-aosta,valdaosta,valle-aosta,valle-d-aosta,valle-daosta,valleaosta,valled-aosta,valledaosta,vallee-aoste,xn--valle-aoste-ebb,vallee-d-aoste,xn--valle-d-aoste-ehb,valleeaoste,xn--valleaoste-e7a,valleedaoste,xn--valledaoste-ebb,vao,vda,ven,veneto,ag,agrigento,al,alessandria,alto-adige,altoadige,an,ancona,andria-barletta-trani,andria-trani-barletta,andriabarlettatrani,andriatranibarletta,ao,aosta,aoste,ap,aq,aquila,ar,arezzo,ascoli-piceno,ascolipiceno,asti,at,av,avellino,ba,balsan-sudtirol,xn--balsan-sdtirol-nsb,balsan-suedtirol,balsan,bari,barletta-trani-andria,barlettatraniandria,belluno,benevento,bergamo,bg,bi,biella,bl,bn,bo,bologna,bolzano-altoadige,bolzano,bozen-sudtirol,xn--bozen-sdtirol-2ob,bozen-suedtirol,bozen,br,brescia,brindisi,bs,bt,bulsan-sudtirol,xn--bulsan-sdtirol-nsb,bulsan-suedtirol,bulsan,bz,ca,cagliari,caltanissetta,campidano-medio,campidanomedio,campobasso,carbonia-iglesias,carboniaiglesias,carrara-massa,carraramassa,caserta,catania,catanzaro,cb,ce,cesena-forli,xn--cesena-forl-mcb,cesenaforli,xn--cesenaforl-i8a,ch,chieti,ci,cl,cn,co,como,cosenza,cr,cremona,crotone,cs,ct,cuneo,cz,dell-ogliastra,dellogliastra,en,enna,fc,fe,fermo,ferrara,fg,fi,firenze,florence,fm,foggia,forli-cesena,xn--forl-cesena-fcb,forlicesena,xn--forlcesena-c8a,fr,frosinone,ge,genoa,genova,go,gorizia,gr,grosseto,iglesias-carbonia,iglesiascarbonia,im,imperia,is,isernia,kr,la-spezia,laquila,laspezia,latina,lc,le,lecce,lecco,li,livorno,lo,lodi,lt,lu,lucca,macerata,mantova,massa-carrara,massacarrara,matera,mb,mc,me,medio-campidano,mediocampidano,messina,mi,milan,milano,mn,mo,modena,monza-brianza,monza-e-della-brianza,monza,monzabrianza,monzaebrianza,monzaedellabrianza,ms,mt,na,naples,napoli,no,novara,nu,nuoro,og,ogliastra,olbia-tempio,olbiatempio,or,oristano,ot,pa,padova,padua,palermo,parma,pavia,pc,pd,pe,perugia,pesaro-urbino,pesarourbino,pescara,pg,pi,piacenza,pisa,pistoia,pn,po,pordenone,potenza,pr,prato,pt,pu,pv,pz,ra,ragusa,ravenna,rc,re,reggio-calabria,reggio-emilia,reggiocalabria,reggioemilia,rg,ri,rieti,rimini,rm,rn,ro,roma,rome,rovigo,sa,salerno,sassari,savona,si,siena,siracusa,so,sondrio,sp,sr,ss,suedtirol,xn--sdtirol-n2a,sv,ta,taranto,te,tempio-olbia,tempioolbia,teramo,terni,tn,to,torino,tp,tr,trani-andria-barletta,trani-barletta-andria,traniandriabarletta,tranibarlettaandria,trapani,trento,treviso,trieste,ts,turin,tv,ud,udine,urbino-pesaro,urbinopesaro,va,varese,vb,vc,ve,venezia,venice,verbania,vercelli,verona,vi,vibo-valentia,vibovalentia,vicenza,viterbo,vr,vs,vt,vv<je>co,net,org<jm>*<jo>com,org,net,edu,sch,gov,mil,name<jobs,jp>ac,ad,co,ed,go,gr,lg,ne,or,aichi>aisai,ama,anjo,asuke,chiryu,chita,fuso,gamagori,handa,hazu,hekinan,higashiura,ichinomiya,inazawa,inuyama,isshiki,iwakura,kanie,kariya,kasugai,kira,kiyosu,komaki,konan,kota,mihama,miyoshi,nishio,nisshin,obu,oguchi,oharu,okazaki,owariasahi,seto,shikatsu,shinshiro,shitara,tahara,takahama,tobishima,toei,togo,tokai,tokoname,toyoake,toyohashi,toyokawa,toyone,toyota,tsushima,yatomi<akita>akita,daisen,fujisato,gojome,hachirogata,happou,higashinaruse,honjo,honjyo,ikawa,kamikoani,kamioka,katagami,kazuno,kitaakita,kosaka,kyowa,misato,mitane,moriyoshi,nikaho,noshiro,odate,oga,ogata,semboku,yokote,yurihonjo<aomori>aomori,gonohe,hachinohe,hashikami,hiranai,hirosaki,itayanagi,kuroishi,misawa,mutsu,nakadomari,noheji,oirase,owani,rokunohe,sannohe,shichinohe,shingo,takko,towada,tsugaru,tsuruta<chiba>abiko,asahi,chonan,chosei,choshi,chuo,funabashi,futtsu,hanamigawa,ichihara,ichikawa,ichinomiya,inzai,isumi,kamagaya,kamogawa,kashiwa,katori,katsuura,kimitsu,kisarazu,kozaki,kujukuri,kyonan,matsudo,midori,mihama,minamiboso,mobara,mutsuzawa,nagara,nagareyama,narashino,narita,noda,oamishirasato,omigawa,onjuku,otaki,sakae,sakura,shimofusa,shirako,shiroi,shisui,sodegaura,sosa,tako,tateyama,togane,tohnosho,tomisato,urayasu,yachimata,yachiyo,yokaichiba,yokoshibahikari,yotsukaido<ehime>ainan,honai,ikata,imabari,iyo,kamijima,kihoku,kumakogen,masaki,matsuno,matsuyama,namikata,niihama,ozu,saijo,seiyo,shikokuchuo,tobe,toon,uchiko,uwajima,yawatahama<fukui>echizen,eiheiji,fukui,ikeda,katsuyama,mihama,minamiechizen,obama,ohi,ono,sabae,sakai,takahama,tsuruga,wakasa<fukuoka>ashiya,buzen,chikugo,chikuho,chikujo,chikushino,chikuzen,chuo,dazaifu,fukuchi,hakata,higashi,hirokawa,hisayama,iizuka,inatsuki,kaho,kasuga,kasuya,kawara,keisen,koga,kurate,kurogi,kurume,minami,miyako,miyama,miyawaka,mizumaki,munakata,nakagawa,nakama,nishi,nogata,ogori,okagaki,okawa,oki,omuta,onga,onojo,oto,saigawa,sasaguri,shingu,shinyoshitomi,shonai,soeda,sue,tachiarai,tagawa,takata,toho,toyotsu,tsuiki,ukiha,umi,usui,yamada,yame,yanagawa,yukuhashi<fukushima>aizubange,aizumisato,aizuwakamatsu,asakawa,bandai,date,fukushima,furudono,futaba,hanawa,higashi,hirata,hirono,iitate,inawashiro,ishikawa,iwaki,izumizaki,kagamiishi,kaneyama,kawamata,kitakata,kitashiobara,koori,koriyama,kunimi,miharu,mishima,namie,nango,nishiaizu,nishigo,okuma,omotego,ono,otama,samegawa,shimogo,shirakawa,showa,soma,sukagawa,taishin,tamakawa,tanagura,tenei,yabuki,yamato,yamatsuri,yanaizu,yugawa<gifu>anpachi,ena,gifu,ginan,godo,gujo,hashima,hichiso,hida,higashishirakawa,ibigawa,ikeda,kakamigahara,kani,kasahara,kasamatsu,kawaue,kitagata,mino,minokamo,mitake,mizunami,motosu,nakatsugawa,ogaki,sakahogi,seki,sekigahara,shirakawa,tajimi,takayama,tarui,toki,tomika,wanouchi,yamagata,yaotsu,yoro<gunma>annaka,chiyoda,fujioka,higashiagatsuma,isesaki,itakura,kanna,kanra,katashina,kawaba,kiryu,kusatsu,maebashi,meiwa,midori,minakami,naganohara,nakanojo,nanmoku,numata,oizumi,ora,ota,shibukawa,shimonita,shinto,showa,takasaki,takayama,tamamura,tatebayashi,tomioka,tsukiyono,tsumagoi,ueno,yoshioka<hiroshima>asaminami,daiwa,etajima,fuchu,fukuyama,hatsukaichi,higashihiroshima,hongo,jinsekikogen,kaita,kui,kumano,kure,mihara,miyoshi,naka,onomichi,osakikamijima,otake,saka,sera,seranishi,shinichi,shobara,takehara<hokkaido>abashiri,abira,aibetsu,akabira,akkeshi,asahikawa,ashibetsu,ashoro,assabu,atsuma,bibai,biei,bifuka,bihoro,biratori,chippubetsu,chitose,date,ebetsu,embetsu,eniwa,erimo,esan,esashi,fukagawa,fukushima,furano,furubira,haboro,hakodate,hamatonbetsu,hidaka,higashikagura,higashikawa,hiroo,hokuryu,hokuto,honbetsu,horokanai,horonobe,ikeda,imakane,ishikari,iwamizawa,iwanai,kamifurano,kamikawa,kamishihoro,kamisunagawa,kamoenai,kayabe,kembuchi,kikonai,kimobetsu,kitahiroshima,kitami,kiyosato,koshimizu,kunneppu,kuriyama,kuromatsunai,kushiro,kutchan,kyowa,mashike,matsumae,mikasa,minamifurano,mombetsu,moseushi,mukawa,muroran,naie,nakagawa,nakasatsunai,nakatombetsu,nanae,nanporo,nayoro,nemuro,niikappu,niki,nishiokoppe,noboribetsu,numata,obihiro,obira,oketo,okoppe,otaru,otobe,otofuke,otoineppu,oumu,ozora,pippu,rankoshi,rebun,rikubetsu,rishiri,rishirifuji,saroma,sarufutsu,shakotan,shari,shibecha,shibetsu,shikabe,shikaoi,shimamaki,shimizu,shimokawa,shinshinotsu,shintoku,shiranuka,shiraoi,shiriuchi,sobetsu,sunagawa,taiki,takasu,takikawa,takinoue,teshikaga,tobetsu,tohma,tomakomai,tomari,toya,toyako,toyotomi,toyoura,tsubetsu,tsukigata,urakawa,urausu,uryu,utashinai,wakkanai,wassamu,yakumo,yoichi<hyogo>aioi,akashi,ako,amagasaki,aogaki,asago,ashiya,awaji,fukusaki,goshiki,harima,himeji,ichikawa,inagawa,itami,kakogawa,kamigori,kamikawa,kasai,kasuga,kawanishi,miki,minamiawaji,nishinomiya,nishiwaki,ono,sanda,sannan,sasayama,sayo,shingu,shinonsen,shiso,sumoto,taishi,taka,takarazuka,takasago,takino,tamba,tatsuno,toyooka,yabu,yashiro,yoka,yokawa<ibaraki>ami,asahi,bando,chikusei,daigo,fujishiro,hitachi,hitachinaka,hitachiomiya,hitachiota,ibaraki,ina,inashiki,itako,iwama,joso,kamisu,kasama,kashima,kasumigaura,koga,miho,mito,moriya,naka,namegata,oarai,ogawa,omitama,ryugasaki,sakai,sakuragawa,shimodate,shimotsuma,shirosato,sowa,suifu,takahagi,tamatsukuri,tokai,tomobe,tone,toride,tsuchiura,tsukuba,uchihara,ushiku,yachiyo,yamagata,yawara,yuki<ishikawa>anamizu,hakui,hakusan,kaga,kahoku,kanazawa,kawakita,komatsu,nakanoto,nanao,nomi,nonoichi,noto,shika,suzu,tsubata,tsurugi,uchinada,wajima<iwate>fudai,fujisawa,hanamaki,hiraizumi,hirono,ichinohe,ichinoseki,iwaizumi,iwate,joboji,kamaishi,kanegasaki,karumai,kawai,kitakami,kuji,kunohe,kuzumaki,miyako,mizusawa,morioka,ninohe,noda,ofunato,oshu,otsuchi,rikuzentakata,shiwa,shizukuishi,sumita,tanohata,tono,yahaba,yamada<kagawa>ayagawa,higashikagawa,kanonji,kotohira,manno,marugame,mitoyo,naoshima,sanuki,tadotsu,takamatsu,tonosho,uchinomi,utazu,zentsuji<kagoshima>akune,amami,hioki,isa,isen,izumi,kagoshima,kanoya,kawanabe,kinko,kouyama,makurazaki,matsumoto,minamitane,nakatane,nishinoomote,satsumasendai,soo,tarumizu,yusui<kanagawa>aikawa,atsugi,ayase,chigasaki,ebina,fujisawa,hadano,hakone,hiratsuka,isehara,kaisei,kamakura,kiyokawa,matsuda,minamiashigara,miura,nakai,ninomiya,odawara,oi,oiso,sagamihara,samukawa,tsukui,yamakita,yamato,yokosuka,yugawara,zama,zushi<kochi>aki,geisei,hidaka,higashitsuno,ino,kagami,kami,kitagawa,kochi,mihara,motoyama,muroto,nahari,nakamura,nankoku,nishitosa,niyodogawa,ochi,okawa,otoyo,otsuki,sakawa,sukumo,susaki,tosa,tosashimizu,toyo,tsuno,umaji,yasuda,yusuhara<kumamoto>amakusa,arao,aso,choyo,gyokuto,kamiamakusa,kikuchi,kumamoto,mashiki,mifune,minamata,minamioguni,nagasu,nishihara,oguni,ozu,sumoto,takamori,uki,uto,yamaga,yamato,yatsushiro<kyoto>ayabe,fukuchiyama,higashiyama,ide,ine,joyo,kameoka,kamo,kita,kizu,kumiyama,kyotamba,kyotanabe,kyotango,maizuru,minami,minamiyamashiro,miyazu,muko,nagaokakyo,nakagyo,nantan,oyamazaki,sakyo,seika,tanabe,uji,ujitawara,wazuka,yamashina,yawata<mie>asahi,inabe,ise,kameyama,kawagoe,kiho,kisosaki,kiwa,komono,kumano,kuwana,matsusaka,meiwa,mihama,minamiise,misugi,miyama,nabari,shima,suzuka,tado,taiki,taki,tamaki,toba,tsu,udono,ureshino,watarai,yokkaichi<miyagi>furukawa,higashimatsushima,ishinomaki,iwanuma,kakuda,kami,kawasaki,marumori,matsushima,minamisanriku,misato,murata,natori,ogawara,ohira,onagawa,osaki,rifu,semine,shibata,shichikashuku,shikama,shiogama,shiroishi,tagajo,taiwa,tome,tomiya,wakuya,watari,yamamoto,zao<miyazaki>aya,ebino,gokase,hyuga,kadogawa,kawaminami,kijo,kitagawa,kitakata,kitaura,kobayashi,kunitomi,kushima,mimata,miyakonojo,miyazaki,morotsuka,nichinan,nishimera,nobeoka,saito,shiiba,shintomi,takaharu,takanabe,takazaki,tsuno<nagano>achi,agematsu,anan,aoki,asahi,azumino,chikuhoku,chikuma,chino,fujimi,hakuba,hara,hiraya,iida,iijima,iiyama,iizuna,ikeda,ikusaka,ina,karuizawa,kawakami,kiso,kisofukushima,kitaaiki,komagane,komoro,matsukawa,matsumoto,miasa,minamiaiki,minamimaki,minamiminowa,minowa,miyada,miyota,mochizuki,nagano,nagawa,nagiso,nakagawa,nakano,nozawaonsen,obuse,ogawa,okaya,omachi,omi,ookuwa,ooshika,otaki,otari,sakae,sakaki,saku,sakuho,shimosuwa,shinanomachi,shiojiri,suwa,suzaka,takagi,takamori,takayama,tateshina,tatsuno,togakushi,togura,tomi,ueda,wada,yamagata,yamanouchi,yasaka,yasuoka<nagasaki>chijiwa,futsu,goto,hasami,hirado,iki,isahaya,kawatana,kuchinotsu,matsuura,nagasaki,obama,omura,oseto,saikai,sasebo,seihi,shimabara,shinkamigoto,togitsu,tsushima,unzen<nara>ando,gose,heguri,higashiyoshino,ikaruga,ikoma,kamikitayama,kanmaki,kashiba,kashihara,katsuragi,kawai,kawakami,kawanishi,koryo,kurotaki,mitsue,miyake,nara,nosegawa,oji,ouda,oyodo,sakurai,sango,shimoichi,shimokitayama,shinjo,soni,takatori,tawaramoto,tenkawa,tenri,uda,yamatokoriyama,yamatotakada,yamazoe,yoshino<niigata>aga,agano,gosen,itoigawa,izumozaki,joetsu,kamo,kariwa,kashiwazaki,minamiuonuma,mitsuke,muika,murakami,myoko,nagaoka,niigata,ojiya,omi,sado,sanjo,seiro,seirou,sekikawa,shibata,tagami,tainai,tochio,tokamachi,tsubame,tsunan,uonuma,yahiko,yoita,yuzawa<oita>beppu,bungoono,bungotakada,hasama,hiji,himeshima,hita,kamitsue,kokonoe,kuju,kunisaki,kusu,oita,saiki,taketa,tsukumi,usa,usuki,yufu<okayama>akaiwa,asakuchi,bizen,hayashima,ibara,kagamino,kasaoka,kibichuo,kumenan,kurashiki,maniwa,misaki,nagi,niimi,nishiawakura,okayama,satosho,setouchi,shinjo,shoo,soja,takahashi,tamano,tsuyama,wake,yakage<okinawa>aguni,ginowan,ginoza,gushikami,haebaru,higashi,hirara,iheya,ishigaki,ishikawa,itoman,izena,kadena,kin,kitadaito,kitanakagusuku,kumejima,kunigami,minamidaito,motobu,nago,naha,nakagusuku,nakijin,nanjo,nishihara,ogimi,okinawa,onna,shimoji,taketomi,tarama,tokashiki,tomigusuku,tonaki,urasoe,uruma,yaese,yomitan,yonabaru,yonaguni,zamami<osaka>abeno,chihayaakasaka,chuo,daito,fujiidera,habikino,hannan,higashiosaka,higashisumiyoshi,higashiyodogawa,hirakata,ibaraki,ikeda,izumi,izumiotsu,izumisano,kadoma,kaizuka,kanan,kashiwara,katano,kawachinagano,kishiwada,kita,kumatori,matsubara,minato,minoh,misaki,moriguchi,neyagawa,nishi,nose,osakasayama,sakai,sayama,sennan,settsu,shijonawate,shimamoto,suita,tadaoka,taishi,tajiri,takaishi,takatsuki,tondabayashi,toyonaka,toyono,yao<saga>ariake,arita,fukudomi,genkai,hamatama,hizen,imari,kamimine,kanzaki,karatsu,kashima,kitagata,kitahata,kiyama,kouhoku,kyuragi,nishiarita,ogi,omachi,ouchi,saga,shiroishi,taku,tara,tosu,yoshinogari<saitama>arakawa,asaka,chichibu,fujimi,fujimino,fukaya,hanno,hanyu,hasuda,hatogaya,hatoyama,hidaka,higashichichibu,higashimatsuyama,honjo,ina,iruma,iwatsuki,kamiizumi,kamikawa,kamisato,kasukabe,kawagoe,kawaguchi,kawajima,kazo,kitamoto,koshigaya,kounosu,kuki,kumagaya,matsubushi,minano,misato,miyashiro,miyoshi,moroyama,nagatoro,namegawa,niiza,ogano,ogawa,ogose,okegawa,omiya,otaki,ranzan,ryokami,saitama,sakado,satte,sayama,shiki,shiraoka,soka,sugito,toda,tokigawa,tokorozawa,tsurugashima,urawa,warabi,yashio,yokoze,yono,yorii,yoshida,yoshikawa,yoshimi<shiga>aisho,gamo,higashiomi,hikone,koka,konan,kosei,koto,kusatsu,maibara,moriyama,nagahama,nishiazai,notogawa,omihachiman,otsu,ritto,ryuoh,takashima,takatsuki,torahime,toyosato,yasu<shimane>akagi,ama,gotsu,hamada,higashiizumo,hikawa,hikimi,izumo,kakinoki,masuda,matsue,misato,nishinoshima,ohda,okinoshima,okuizumo,shimane,tamayu,tsuwano,unnan,yakumo,yasugi,yatsuka<shizuoka>arai,atami,fuji,fujieda,fujikawa,fujinomiya,fukuroi,gotemba,haibara,hamamatsu,higashiizu,ito,iwata,izu,izunokuni,kakegawa,kannami,kawanehon,kawazu,kikugawa,kosai,makinohara,matsuzaki,minamiizu,mishima,morimachi,nishiizu,numazu,omaezaki,shimada,shimizu,shimoda,shizuoka,susono,yaizu,yoshida<tochigi>ashikaga,bato,haga,ichikai,iwafune,kaminokawa,kanuma,karasuyama,kuroiso,mashiko,mibu,moka,motegi,nasu,nasushiobara,nikko,nishikata,nogi,ohira,ohtawara,oyama,sakura,sano,shimotsuke,shioya,takanezawa,tochigi,tsuga,ujiie,utsunomiya,yaita<tokushima>aizumi,anan,ichiba,itano,kainan,komatsushima,matsushige,mima,minami,miyoshi,mugi,nakagawa,naruto,sanagochi,shishikui,tokushima,wajiki<tokyo>adachi,akiruno,akishima,aogashima,arakawa,bunkyo,chiyoda,chofu,chuo,edogawa,fuchu,fussa,hachijo,hachioji,hamura,higashikurume,higashimurayama,higashiyamato,hino,hinode,hinohara,inagi,itabashi,katsushika,kita,kiyose,kodaira,koganei,kokubunji,komae,koto,kouzushima,kunitachi,machida,meguro,minato,mitaka,mizuho,musashimurayama,musashino,nakano,nerima,ogasawara,okutama,ome,oshima,ota,setagaya,shibuya,shinagawa,shinjuku,suginami,sumida,tachikawa,taito,tama,toshima<tottori>chizu,hino,kawahara,koge,kotoura,misasa,nanbu,nichinan,sakaiminato,tottori,wakasa,yazu,yonago<toyama>asahi,fuchu,fukumitsu,funahashi,himi,imizu,inami,johana,kamiichi,kurobe,nakaniikawa,namerikawa,nanto,nyuzen,oyabe,taira,takaoka,tateyama,toga,tonami,toyama,unazuki,uozu,yamada<wakayama>arida,aridagawa,gobo,hashimoto,hidaka,hirogawa,inami,iwade,kainan,kamitonda,katsuragi,kimino,kinokawa,kitayama,koya,koza,kozagawa,kudoyama,kushimoto,mihama,misato,nachikatsuura,shingu,shirahama,taiji,tanabe,wakayama,yuasa,yura<yamagata>asahi,funagata,higashine,iide,kahoku,kaminoyama,kaneyama,kawanishi,mamurogawa,mikawa,murayama,nagai,nakayama,nanyo,nishikawa,obanazawa,oe,oguni,ohkura,oishida,sagae,sakata,sakegawa,shinjo,shirataka,shonai,takahata,tendo,tozawa,tsuruoka,yamagata,yamanobe,yonezawa,yuza<yamaguchi>abu,hagi,hikari,hofu,iwakuni,kudamatsu,mitou,nagato,oshima,shimonoseki,shunan,tabuse,tokuyama,toyota,ube,yuu<yamanashi>chuo,doshi,fuefuki,fujikawa,fujikawaguchiko,fujiyoshida,hayakawa,hokuto,ichikawamisato,kai,kofu,koshu,kosuge,minami-alps,minobu,nakamichi,nanbu,narusawa,nirasaki,nishikatsura,oshino,otsuki,showa,tabayama,tsuru,uenohara,yamanakako,yamanashi<xn--4pvxs,xn--vgu402c,xn--c3s14m,xn--f6qx53a,xn--8pvr4u,xn--uist22h,xn--djrs72d6uy,xn--mkru45i,xn--0trq7p7nn,xn--8ltr62k,xn--2m4a15e,xn--efvn9s,xn--32vp30h,xn--4it797k,xn--1lqs71d,xn--5rtp49c,xn--5js045d,xn--ehqz56n,xn--1lqs03n,xn--qqqt11m,xn--kbrq7o,xn--pssu33l,xn--ntsq17g,xn--uisz3g,xn--6btw5a,xn--1ctwo,xn--6orx2r,xn--rht61e,xn--rht27z,xn--djty4k,xn--nit225k,xn--rht3d,xn--klty5x,xn--kltx9a,xn--kltp7d,xn--uuwu58a,xn--zbx025d,xn--ntso0iqx3a,xn--elqq16h,xn--4it168d,xn--klt787d,xn--rny31h,xn--7t0a264c,xn--5rtq34k,xn--k7yn95e,xn--tor131o,xn--d5qv7z876c,kawasaki>*,!city<kitakyushu>*,!city<kobe>*,!city<nagoya>*,!city<sapporo>*,!city<sendai>*,!city<yokohama>*,!city<<ke>ac,co,go,info,me,mobi,ne,or,sc<kg>org,net,com,edu,gov,mil<kh>*<ki>edu,biz,net,org,gov,info,com<km>org,nom,gov,prd,tm,edu,mil,ass,com,coop,asso,presse,medecin,notaires,pharmaciens,veterinaire,gouv<kn>net,org,edu,gov<kp>com,edu,gov,org,rep,tra<kr>ac,co,es,go,hs,kg,mil,ms,ne,or,pe,re,sc,busan,chungbuk,chungnam,daegu,daejeon,gangwon,gwangju,gyeongbuk,gyeonggi,gyeongnam,incheon,jeju,jeonbuk,jeonnam,seoul,ulsan<kw>com,edu,emb,gov,ind,net,org<ky>com,edu,net,org<kz>org,edu,net,gov,mil,com<la>int,net,info,edu,gov,per,com,org<lb>com,edu,gov,net,org<lc>com,net,co,org,edu,gov<li,lk>gov,sch,net,int,com,org,edu,ngo,soc,web,ltd,assn,grp,hotel,ac<lr>com,edu,gov,org,net<ls>ac,biz,co,edu,gov,info,net,org,sc<lt>gov<lu,lv>com,edu,gov,org,mil,id,net,asn,conf<ly>com,net,gov,plc,edu,sch,med,org,id<ma>co,net,gov,org,ac,press<mc>tm,asso<md,me>co,net,org,edu,ac,gov,its,priv<mg>org,nom,gov,prd,tm,edu,mil,com,co<mh,mil,mk>com,org,net,edu,gov,inf,name<ml>com,edu,gouv,gov,net,org,presse<mm>*<mn>gov,edu,org<mo>com,net,org,edu,gov<mobi,mp,mq,mr>gov<ms>com,edu,gov,net,org<mt>com,edu,net,org<mu>com,net,org,gov,ac,co,or<museum>academy,agriculture,air,airguard,alabama,alaska,amber,ambulance,american,americana,americanantiques,americanart,amsterdam,and,annefrank,anthro,anthropology,antiques,aquarium,arboretum,archaeological,archaeology,architecture,art,artanddesign,artcenter,artdeco,arteducation,artgallery,arts,artsandcrafts,asmatart,assassination,assisi,association,astronomy,atlanta,austin,australia,automotive,aviation,axis,badajoz,baghdad,bahn,bale,baltimore,barcelona,baseball,basel,baths,bauern,beauxarts,beeldengeluid,bellevue,bergbau,berkeley,berlin,bern,bible,bilbao,bill,birdart,birthplace,bonn,boston,botanical,botanicalgarden,botanicgarden,botany,brandywinevalley,brasil,bristol,british,britishcolumbia,broadcast,brunel,brussel,brussels,bruxelles,building,burghof,bus,bushey,cadaques,california,cambridge,can,canada,capebreton,carrier,cartoonart,casadelamoneda,castle,castres,celtic,center,chattanooga,cheltenham,chesapeakebay,chicago,children,childrens,childrensgarden,chiropractic,chocolate,christiansburg,cincinnati,cinema,circus,civilisation,civilization,civilwar,clinton,clock,coal,coastaldefence,cody,coldwar,collection,colonialwilliamsburg,coloradoplateau,columbia,columbus,communication,communications,community,computer,computerhistory,xn--comunicaes-v6a2o,contemporary,contemporaryart,convent,copenhagen,corporation,xn--correios-e-telecomunicaes-ghc29a,corvette,costume,countryestate,county,crafts,cranbrook,creation,cultural,culturalcenter,culture,cyber,cymru,dali,dallas,database,ddr,decorativearts,delaware,delmenhorst,denmark,depot,design,detroit,dinosaur,discovery,dolls,donostia,durham,eastafrica,eastcoast,education,educational,egyptian,eisenbahn,elburg,elvendrell,embroidery,encyclopedic,england,entomology,environment,environmentalconservation,epilepsy,essex,estate,ethnology,exeter,exhibition,family,farm,farmequipment,farmers,farmstead,field,figueres,filatelia,film,fineart,finearts,finland,flanders,florida,force,fortmissoula,fortworth,foundation,francaise,frankfurt,franziskaner,freemasonry,freiburg,fribourg,frog,fundacio,furniture,gallery,garden,gateway,geelvinck,gemological,geology,georgia,giessen,glas,glass,gorge,grandrapids,graz,guernsey,halloffame,hamburg,handson,harvestcelebration,hawaii,health,heimatunduhren,hellas,helsinki,hembygdsforbund,heritage,histoire,historical,historicalsociety,historichouses,historisch,historisches,history,historyofscience,horology,house,humanities,illustration,imageandsound,indian,indiana,indianapolis,indianmarket,intelligence,interactive,iraq,iron,isleofman,jamison,jefferson,jerusalem,jewelry,jewish,jewishart,jfk,journalism,judaica,judygarland,juedisches,juif,karate,karikatur,kids,koebenhavn,koeln,kunst,kunstsammlung,kunstunddesign,labor,labour,lajolla,lancashire,landes,lans,xn--lns-qla,larsson,lewismiller,lincoln,linz,living,livinghistory,localhistory,london,losangeles,louvre,loyalist,lucerne,luxembourg,luzern,mad,madrid,mallorca,manchester,mansion,mansions,manx,marburg,maritime,maritimo,maryland,marylhurst,media,medical,medizinhistorisches,meeres,memorial,mesaverde,michigan,midatlantic,military,mill,miners,mining,minnesota,missile,missoula,modern,moma,money,monmouth,monticello,montreal,moscow,motorcycle,muenchen,muenster,mulhouse,muncie,museet,museumcenter,museumvereniging,music,national,nationalfirearms,nationalheritage,nativeamerican,naturalhistory,naturalhistorymuseum,naturalsciences,nature,naturhistorisches,natuurwetenschappen,naumburg,naval,nebraska,neues,newhampshire,newjersey,newmexico,newport,newspaper,newyork,niepce,norfolk,north,nrw,nyc,nyny,oceanographic,oceanographique,omaha,online,ontario,openair,oregon,oregontrail,otago,oxford,pacific,paderborn,palace,paleo,palmsprings,panama,paris,pasadena,pharmacy,philadelphia,philadelphiaarea,philately,phoenix,photography,pilots,pittsburgh,planetarium,plantation,plants,plaza,portal,portland,portlligat,posts-and-telecommunications,preservation,presidio,press,project,public,pubol,quebec,railroad,railway,research,resistance,riodejaneiro,rochester,rockart,roma,russia,saintlouis,salem,salvadordali,salzburg,sandiego,sanfrancisco,santabarbara,santacruz,santafe,saskatchewan,satx,savannahga,schlesisches,schoenbrunn,schokoladen,school,schweiz,science,scienceandhistory,scienceandindustry,sciencecenter,sciencecenters,science-fiction,sciencehistory,sciences,sciencesnaturelles,scotland,seaport,settlement,settlers,shell,sherbrooke,sibenik,silk,ski,skole,society,sologne,soundandvision,southcarolina,southwest,space,spy,square,stadt,stalbans,starnberg,state,stateofdelaware,station,steam,steiermark,stjohn,stockholm,stpetersburg,stuttgart,suisse,surgeonshall,surrey,svizzera,sweden,sydney,tank,tcm,technology,telekommunikation,television,texas,textile,theater,time,timekeeping,topology,torino,touch,town,transport,tree,trolley,trust,trustee,uhren,ulm,undersea,university,usa,usantiques,usarts,uscountryestate,usculture,usdecorativearts,usgarden,ushistory,ushuaia,uslivinghistory,utah,uvic,valley,vantaa,versailles,viking,village,virginia,virtual,virtuel,vlaanderen,volkenkunde,wales,wallonie,war,washingtondc,watchandclock,watch-and-clock,western,westfalen,whaling,wildlife,williamsburg,windmill,workshop,york,yorkshire,yosemite,youth,zoological,zoology,xn--9dbhblg6di,xn--h1aegh<mv>aero,biz,com,coop,edu,gov,info,int,mil,museum,name,net,org,pro<mw>ac,biz,co,com,coop,edu,gov,int,museum,net,org<mx>com,org,gob,edu,net<my>biz,com,edu,gov,mil,name,net,org<mz>ac,adv,co,edu,gov,mil,net,org<na>info,pro,name,school,or,dr,us,mx,ca,in,cc,tv,ws,mobi,co,com,org<name,nc>asso,nom<ne,net,nf>com,net,per,rec,web,arts,firm,info,other,store<ng>com,edu,gov,i,mil,mobi,name,net,org,sch<ni>ac,biz,co,com,edu,gob,in,info,int,mil,net,nom,org,web<nl,no>fhs,vgs,fylkesbibl,folkebibl,museum,idrett,priv,mil,stat,dep,kommune,herad,aa>gs<ah>gs<bu>gs<fm>gs<hl>gs<hm>gs<jan-mayen>gs<mr>gs<nl>gs<nt>gs<of>gs<ol>gs<oslo>gs<rl>gs<sf>gs<st>gs<svalbard>gs<tm>gs<tr>gs<va>gs<vf>gs<akrehamn,xn--krehamn-dxa,algard,xn--lgrd-poac,arna,brumunddal,bryne,bronnoysund,xn--brnnysund-m8ac,drobak,xn--drbak-wua,egersund,fetsund,floro,xn--flor-jra,fredrikstad,hokksund,honefoss,xn--hnefoss-q1a,jessheim,jorpeland,xn--jrpeland-54a,kirkenes,kopervik,krokstadelva,langevag,xn--langevg-jxa,leirvik,mjondalen,xn--mjndalen-64a,mo-i-rana,mosjoen,xn--mosjen-eya,nesoddtangen,orkanger,osoyro,xn--osyro-wua,raholt,xn--rholt-mra,sandnessjoen,xn--sandnessjen-ogb,skedsmokorset,slattum,spjelkavik,stathelle,stavern,stjordalshalsen,xn--stjrdalshalsen-sqb,tananger,tranby,vossevangen,afjord,xn--fjord-lra,agdenes,al,xn--l-1fa,alesund,xn--lesund-hua,alstahaug,alta,xn--lt-liac,alaheadju,xn--laheadju-7ya,alvdal,amli,xn--mli-tla,amot,xn--mot-tla,andebu,andoy,xn--andy-ira,andasuolo,ardal,xn--rdal-poa,aremark,arendal,xn--s-1fa,aseral,xn--seral-lra,asker,askim,askvoll,askoy,xn--asky-ira,asnes,xn--snes-poa,audnedaln,aukra,aure,aurland,aurskog-holand,xn--aurskog-hland-jnb,austevoll,austrheim,averoy,xn--avery-yua,balestrand,ballangen,balat,xn--blt-elab,balsfjord,bahccavuotna,xn--bhccavuotna-k7a,bamble,bardu,beardu,beiarn,bajddar,xn--bjddar-pta,baidar,xn--bidr-5nac,berg,bergen,berlevag,xn--berlevg-jxa,bearalvahki,xn--bearalvhki-y4a,bindal,birkenes,bjarkoy,xn--bjarky-fya,bjerkreim,bjugn,bodo,xn--bod-2na,badaddja,xn--bdddj-mrabd,budejju,bokn,bremanger,bronnoy,xn--brnny-wuac,bygland,bykle,barum,xn--brum-voa,telemark>bo,xn--b-5ga<nordland>bo,xn--b-5ga,heroy,xn--hery-ira<bievat,xn--bievt-0qa,bomlo,xn--bmlo-gra,batsfjord,xn--btsfjord-9za,bahcavuotna,xn--bhcavuotna-s4a,dovre,drammen,drangedal,dyroy,xn--dyry-ira,donna,xn--dnna-gra,eid,eidfjord,eidsberg,eidskog,eidsvoll,eigersund,elverum,enebakk,engerdal,etne,etnedal,evenes,evenassi,xn--eveni-0qa01ga,evje-og-hornnes,farsund,fauske,fuossko,fuoisku,fedje,fet,finnoy,xn--finny-yua,fitjar,fjaler,fjell,flakstad,flatanger,flekkefjord,flesberg,flora,fla,xn--fl-zia,folldal,forsand,fosnes,frei,frogn,froland,frosta,frana,xn--frna-woa,froya,xn--frya-hra,fusa,fyresdal,forde,xn--frde-gra,gamvik,gangaviika,xn--ggaviika-8ya47h,gaular,gausdal,gildeskal,xn--gildeskl-g0a,giske,gjemnes,gjerdrum,gjerstad,gjesdal,gjovik,xn--gjvik-wua,gloppen,gol,gran,grane,granvin,gratangen,grimstad,grong,kraanghke,xn--kranghke-b0a,grue,gulen,hadsel,halden,halsa,hamar,hamaroy,habmer,xn--hbmer-xqa,hapmir,xn--hpmir-xqa,hammerfest,hammarfeasta,xn--hmmrfeasta-s4ac,haram,hareid,harstad,hasvik,aknoluokta,xn--koluokta-7ya57h,hattfjelldal,aarborte,haugesund,hemne,hemnes,hemsedal,more-og-romsdal>heroy,sande<xn--mre-og-romsdal-qqb>xn--hery-ira,sande<hitra,hjartdal,hjelmeland,hobol,xn--hobl-ira,hof,hol,hole,holmestrand,holtalen,xn--holtlen-hxa,hornindal,horten,hurdal,hurum,hvaler,hyllestad,hagebostad,xn--hgebostad-g3a,hoyanger,xn--hyanger-q1a,hoylandet,xn--hylandet-54a,ha,xn--h-2fa,ibestad,inderoy,xn--indery-fya,iveland,jevnaker,jondal,jolster,xn--jlster-bya,karasjok,karasjohka,xn--krjohka-hwab49j,karlsoy,galsa,xn--gls-elac,karmoy,xn--karmy-yua,kautokeino,guovdageaidnu,klepp,klabu,xn--klbu-woa,kongsberg,kongsvinger,kragero,xn--krager-gya,kristiansand,kristiansund,krodsherad,xn--krdsherad-m8a,kvalsund,rahkkeravju,xn--rhkkervju-01af,kvam,kvinesdal,kvinnherad,kviteseid,kvitsoy,xn--kvitsy-fya,kvafjord,xn--kvfjord-nxa,giehtavuoatna,kvanangen,xn--kvnangen-k0a,navuotna,xn--nvuotna-hwa,kafjord,xn--kfjord-iua,gaivuotna,xn--givuotna-8ya,larvik,lavangen,lavagis,loabat,xn--loabt-0qa,lebesby,davvesiida,leikanger,leirfjord,leka,leksvik,lenvik,leangaviika,xn--leagaviika-52b,lesja,levanger,lier,lierne,lillehammer,lillesand,lindesnes,lindas,xn--linds-pra,lom,loppa,lahppi,xn--lhppi-xqa,lund,lunner,luroy,xn--lury-ira,luster,lyngdal,lyngen,ivgu,lardal,lerdal,xn--lrdal-sra,lodingen,xn--ldingen-q1a,lorenskog,xn--lrenskog-54a,loten,xn--lten-gra,malvik,masoy,xn--msy-ula0h,muosat,xn--muost-0qa,mandal,marker,marnardal,masfjorden,meland,meldal,melhus,meloy,xn--mely-ira,meraker,xn--merker-kua,moareke,xn--moreke-jua,midsund,midtre-gauldal,modalen,modum,molde,moskenes,moss,mosvik,malselv,xn--mlselv-iua,malatvuopmi,xn--mlatvuopmi-s4a,namdalseid,aejrie,namsos,namsskogan,naamesjevuemie,xn--nmesjevuemie-tcba,laakesvuemie,nannestad,narvik,narviika,naustdal,nedre-eiker,akershus>nes<buskerud>nes<nesna,nesodden,nesseby,unjarga,xn--unjrga-rta,nesset,nissedal,nittedal,nord-aurdal,nord-fron,nord-odal,norddal,nordkapp,davvenjarga,xn--davvenjrga-y4a,nordre-land,nordreisa,raisa,xn--risa-5na,nore-og-uvdal,notodden,naroy,xn--nry-yla5g,notteroy,xn--nttery-byae,odda,oksnes,xn--ksnes-uua,oppdal,oppegard,xn--oppegrd-ixa,orkdal,orland,xn--rland-uua,orskog,xn--rskog-uua,orsta,xn--rsta-fra,hedmark>os,valer,xn--vler-qoa<hordaland>os<osen,osteroy,xn--ostery-fya,ostre-toten,xn--stre-toten-zcb,overhalla,ovre-eiker,xn--vre-eiker-k8a,oyer,xn--yer-zna,oygarden,xn--ygarden-p1a,oystre-slidre,xn--ystre-slidre-ujb,porsanger,porsangu,xn--porsgu-sta26f,porsgrunn,radoy,xn--rady-ira,rakkestad,rana,ruovat,randaberg,rauma,rendalen,rennebu,rennesoy,xn--rennesy-v1a,rindal,ringebu,ringerike,ringsaker,rissa,risor,xn--risr-ira,roan,rollag,rygge,ralingen,xn--rlingen-mxa,rodoy,xn--rdy-0nab,romskog,xn--rmskog-bya,roros,xn--rros-gra,rost,xn--rst-0na,royken,xn--ryken-vua,royrvik,xn--ryrvik-bya,rade,xn--rde-ula,salangen,siellak,saltdal,salat,xn--slt-elab,xn--slat-5na,samnanger,vestfold>sande<sandefjord,sandnes,sandoy,xn--sandy-yua,sarpsborg,sauda,sauherad,sel,selbu,selje,seljord,sigdal,siljan,sirdal,skaun,skedsmo,ski,skien,skiptvet,skjervoy,xn--skjervy-v1a,skierva,xn--skierv-uta,skjak,xn--skjk-soa,skodje,skanland,xn--sknland-fxa,skanit,xn--sknit-yqa,smola,xn--smla-hra,snillfjord,snasa,xn--snsa-roa,snoasa,snaase,xn--snase-nra,sogndal,sokndal,sola,solund,songdalen,sortland,spydeberg,stange,stavanger,steigen,steinkjer,stjordal,xn--stjrdal-s1a,stokke,stor-elvdal,stord,stordal,storfjord,omasvuotna,strand,stranda,stryn,sula,suldal,sund,sunndal,surnadal,sveio,svelvik,sykkylven,sogne,xn--sgne-gra,somna,xn--smna-gra,sondre-land,xn--sndre-land-0cb,sor-aurdal,xn--sr-aurdal-l8a,sor-fron,xn--sr-fron-q1a,sor-odal,xn--sr-odal-q1a,sor-varanger,xn--sr-varanger-ggb,matta-varjjat,xn--mtta-vrjjat-k7af,sorfold,xn--srfold-bya,sorreisa,xn--srreisa-q1a,sorum,xn--srum-gra,tana,deatnu,time,tingvoll,tinn,tjeldsund,dielddanuorri,tjome,xn--tjme-hra,tokke,tolga,torsken,tranoy,xn--trany-yua,tromso,xn--troms-zua,tromsa,romsa,trondheim,troandin,trysil,trana,xn--trna-woa,trogstad,xn--trgstad-r1a,tvedestrand,tydal,tynset,tysfjord,divtasvuodna,divttasvuotna,tysnes,tysvar,xn--tysvr-vra,tonsberg,xn--tnsberg-q1a,ullensaker,ullensvang,ulvik,utsira,vadso,xn--vads-jra,cahcesuolo,xn--hcesuolo-7ya35b,vaksdal,valle,vang,vanylven,vardo,xn--vard-jra,varggat,xn--vrggt-xqad,vefsn,vaapste,vega,vegarshei,xn--vegrshei-c0a,vennesla,verdal,verran,vestby,vestnes,vestre-slidre,vestre-toten,vestvagoy,xn--vestvgy-ixa6o,vevelstad,vik,vikna,vindafjord,volda,voss,varoy,xn--vry-yla5g,vagan,xn--vgan-qoa,voagat,vagsoy,xn--vgsy-qoa0j,vaga,xn--vg-yiab,ostfold>valer<xn--stfold-9xa>xn--vler-qoa<<np>*<nr>biz,info,gov,edu,org,net,com<nu,nz>ac,co,cri,geek,gen,govt,health,iwi,kiwi,maori,mil,xn--mori-qsa,net,org,parliament,school<om>co,com,edu,gov,med,museum,net,org,pro<onion,org,pa>ac,gob,com,org,sld,edu,net,ing,abo,med,nom<pe>edu,gob,nom,mil,org,com,net<pf>com,org,edu<pg>*<ph>com,net,org,gov,edu,ngo,mil,i<pk>com,net,edu,org,fam,biz,web,gov,gob,gok,gon,gop,gos,info<pl>com,net,org,aid,agro,atm,auto,biz,edu,gmina,gsm,info,mail,miasta,media,mil,nieruchomosci,nom,pc,powiat,priv,realestate,rel,sex,shop,sklep,sos,szkola,targi,tm,tourism,travel,turystyka,gov>ap,ic,is,us,kmpsp,kppsp,kwpsp,psp,wskr,kwp,mw,ug,um,umig,ugim,upow,uw,starostwo,pa,po,psse,pup,rzgw,sa,so,sr,wsa,sko,uzs,wiih,winb,pinb,wios,witd,wzmiuw,piw,wiw,griw,wif,oum,sdn,zp,uppo,mup,wuoz,konsulat,oirm<augustow,babia-gora,bedzin,beskidy,bialowieza,bialystok,bielawa,bieszczady,boleslawiec,bydgoszcz,bytom,cieszyn,czeladz,czest,dlugoleka,elblag,elk,glogow,gniezno,gorlice,grajewo,ilawa,jaworzno,jelenia-gora,jgora,kalisz,kazimierz-dolny,karpacz,kartuzy,kaszuby,katowice,kepno,ketrzyn,klodzko,kobierzyce,kolobrzeg,konin,konskowola,kutno,lapy,lebork,legnica,lezajsk,limanowa,lomza,lowicz,lubin,lukow,malbork,malopolska,mazowsze,mazury,mielec,mielno,mragowo,naklo,nowaruda,nysa,olawa,olecko,olkusz,olsztyn,opoczno,opole,ostroda,ostroleka,ostrowiec,ostrowwlkp,pila,pisz,podhale,podlasie,polkowice,pomorze,pomorskie,prochowice,pruszkow,przeworsk,pulawy,radom,rawa-maz,rybnik,rzeszow,sanok,sejny,slask,slupsk,sosnowiec,stalowa-wola,skoczow,starachowice,stargard,suwalki,swidnica,swiebodzin,swinoujscie,szczecin,szczytno,tarnobrzeg,tgory,turek,tychy,ustka,walbrzych,warmia,warszawa,waw,wegrow,wielun,wlocl,wloclawek,wodzislaw,wolomin,wroclaw,zachpomor,zagan,zarow,zgora,zgorzelec<pm,pn>gov,co,org,edu,net<post,pr>com,net,org,gov,edu,isla,pro,biz,info,name,est,prof,ac<pro>aaa,aca,acct,avocat,bar,cpa,eng,jur,law,med,recht<ps>edu,gov,sec,plo,com,org,net<pt>net,gov,org,edu,int,publ,com,nome<pw>co,ne,or,ed,go,belau<py>com,coop,edu,gov,mil,net,org<qa>com,edu,gov,mil,name,net,org,sch<re>asso,com,nom<ro>arts,com,firm,info,nom,nt,org,rec,store,tm,www<rs>ac,co,edu,gov,in,org<ru,rw>ac,co,coop,gov,mil,net,org<sa>com,net,org,gov,med,pub,edu,sch<sb>com,edu,gov,net,org<sc>com,gov,net,org,edu<sd>com,net,org,edu,med,tv,gov,info<se>a,ac,b,bd,brand,c,d,e,f,fh,fhsk,fhv,g,h,i,k,komforb,kommunalforbund,komvux,l,lanbib,m,n,naturbruksgymn,o,org,p,parti,pp,press,r,s,t,tm,u,w,x,y,z<sg>com,net,org,gov,edu,per<sh>com,net,gov,org,mil<si,sj,sk,sl>com,net,edu,gov,org<sm,sn>art,com,edu,gouv,org,perso,univ<so>com,edu,gov,me,net,org<sr,ss>biz,com,edu,gov,me,net,org,sch<st>co,com,consulado,edu,embaixada,mil,net,org,principe,saotome,store<su,sv>com,edu,gob,org,red<sx>gov<sy>edu,gov,net,mil,com,org<sz>co,ac,org<tc,td,tel,tf,tg,th>ac,co,go,in,mi,net,or<tj>ac,biz,co,com,edu,go,gov,int,mil,name,net,nic,org,test,web<tk,tl>gov<tm>com,co,org,net,nom,gov,mil,edu<tn>com,ens,fin,gov,ind,info,intl,mincom,nat,net,org,perso,tourism<to>com,gov,net,org,edu,mil<tr>av,bbs,bel,biz,com,dr,edu,gen,gov,info,mil,k12,kep,name,net,org,pol,tel,tsk,tv,web,nc>gov<<tt>co,com,org,net,biz,info,pro,int,coop,jobs,mobi,travel,museum,aero,name,gov,edu<tv,tw>edu,gov,mil,com,net,org,idv,game,ebiz,club,xn--zf0ao64a,xn--uc0atv,xn--czrw28b<tz>ac,co,go,hotel,info,me,mil,mobi,ne,or,sc,tv<ua>com,edu,gov,in,net,org,cherkassy,cherkasy,chernigov,chernihiv,chernivtsi,chernovtsy,ck,cn,cr,crimea,cv,dn,dnepropetrovsk,dnipropetrovsk,donetsk,dp,if,ivano-frankivsk,kh,kharkiv,kharkov,kherson,khmelnitskiy,khmelnytskyi,kiev,kirovograd,km,kr,krym,ks,kv,kyiv,lg,lt,lugansk,lutsk,lv,lviv,mk,mykolaiv,nikolaev,od,odesa,odessa,pl,poltava,rivne,rovno,rv,sb,sebastopol,sevastopol,sm,sumy,te,ternopil,uz,uzhgorod,vinnica,vinnytsia,vn,volyn,yalta,zaporizhzhe,zaporizhzhia,zhitomir,zhytomyr,zp,zt<ug>co,or,ac,sc,go,ne,com,org<uk>ac,co,gov,ltd,me,net,nhs,org,plc,police,sch>*<<us>dni,fed,isa,kids,nsn,ak>k12,cc,lib<al>k12,cc,lib<ar>k12,cc,lib<as>k12,cc,lib<az>k12,cc,lib<ca>k12,cc,lib<co>k12,cc,lib<ct>k12,cc,lib<dc>k12,cc,lib<de>k12,cc<fl>k12,cc,lib<ga>k12,cc,lib<gu>k12,cc,lib<hi>cc,lib<ia>k12,cc,lib<id>k12,cc,lib<il>k12,cc,lib<in>k12,cc,lib<ks>k12,cc,lib<ky>k12,cc,lib<la>k12,cc,lib<ma>k12>pvt,chtr,paroch<cc,lib<md>k12,cc,lib<me>k12,cc,lib<mi>k12,cc,lib,ann-arbor,cog,dst,eaton,gen,mus,tec,washtenaw<mn>k12,cc,lib<mo>k12,cc,lib<ms>k12,cc,lib<mt>k12,cc,lib<nc>k12,cc,lib<nd>cc,lib<ne>k12,cc,lib<nh>k12,cc,lib<nj>k12,cc,lib<nm>k12,cc,lib<nv>k12,cc,lib<ny>k12,cc,lib<oh>k12,cc,lib<ok>k12,cc,lib<or>k12,cc,lib<pa>k12,cc,lib<pr>k12,cc,lib<ri>cc,lib<sc>k12,cc,lib<sd>cc,lib<tn>k12,cc,lib<tx>k12,cc,lib<ut>k12,cc,lib<vi>k12,cc,lib<vt>k12,cc,lib<va>k12,cc,lib<wa>k12,cc,lib<wi>k12,cc,lib<wv>cc<wy>k12,cc,lib<<uy>com,edu,gub,mil,net,org<uz>co,com,net,org<va,vc>com,net,org,gov,mil,edu<ve>arts,bib,co,com,e12,edu,firm,gob,gov,info,int,mil,net,nom,org,rar,rec,store,tec,web<vg,vi>co,com,k12,net,org<vn>com,net,org,edu,gov,int,ac,biz,info,name,pro,health<vu>com,edu,net,org<wf,ws>com,net,org,gov,edu<yt,xn--mgbaam7a8h,xn--y9a3aq,xn--54b7fta0cc,xn--90ae,xn--mgbcpq6gpa1a,xn--90ais,xn--fiqs8s,xn--fiqz9s,xn--lgbbat1ad8j,xn--wgbh1c,xn--e1a4c,xn--qxa6a,xn--mgbah1a3hjkrd,xn--node,xn--qxam,xn--j6w193g>xn--55qx5d,xn--wcvs22d,xn--mxtq1m,xn--gmqw5a,xn--od0alg,xn--uc0atv<xn--2scrj9c,xn--3hcrj9c,xn--45br5cyl,xn--h2breg3eve,xn--h2brj9c8c,xn--mgbgu82a,xn--rvc1e0am3e,xn--h2brj9c,xn--mgbbh1a,xn--mgbbh1a71e,xn--fpcrj9c3d,xn--gecrj9c,xn--s9brj9c,xn--45brj9c,xn--xkc2dl3a5ee0h,xn--mgba3a4f16a,xn--mgba3a4fra,xn--mgbtx2b,xn--mgbayh7gpa,xn--3e0b707e,xn--80ao21a,xn--q7ce6a,xn--fzc2c9e2c,xn--xkc2al3hye2a,xn--mgbc0a9azcg,xn--d1alf,xn--l1acc,xn--mix891f,xn--mix082f,xn--mgbx4cd0ab,xn--mgb9awbf,xn--mgbai9azgqp6j,xn--mgbai9a5eva00b,xn--ygbi2ammx,xn--90a3ac>xn--o1ac,xn--c1avg,xn--90azh,xn--d1at,xn--o1ach,xn--80au<xn--p1ai,xn--wgbl6a,xn--mgberp4a5d4ar,xn--mgberp4a5d4a87g,xn--mgbqly7c0a67fbc,xn--mgbqly7cvafr,xn--mgbpl2fh,xn--yfro4i67o,xn--clchc0ea0b2g2a9gcd,xn--ogbpf8fl,xn--mgbtf8fl,xn--o3cw4h>xn--12c1fe0br,xn--12co0c3b4eva,xn--h3cuzk1di,xn--o3cyx2a,xn--m3ch0j3a,xn--12cfi8ixb8l<xn--pgbs0dh,xn--kpry57d,xn--kprw13d,xn--nnx388a,xn--j1amh,xn--mgb2ddes,xxx,ye>com,edu,gov,net,mil,org<za>ac,agric,alt,co,edu,gov,grondar,law,mil,net,ngo,nic,nis,nom,org,school,tm,web<zm>ac,biz,co,com,edu,gov,info,mil,net,org,sch<zw>ac,co,gov,mil,org<aaa,aarp,abarth,abb,abbott,abbvie,abc,able,abogado,abudhabi,academy,accenture,accountant,accountants,aco,actor,adac,ads,adult,aeg,aetna,afl,africa,agakhan,agency,aig,airbus,airforce,airtel,akdn,alfaromeo,alibaba,alipay,allfinanz,allstate,ally,alsace,alstom,amazon,americanexpress,americanfamily,amex,amfam,amica,amsterdam,analytics,android,anquan,anz,aol,apartments,app,apple,aquarelle,arab,aramco,archi,army,art,arte,asda,associates,athleta,attorney,auction,audi,audible,audio,auspost,author,auto,autos,avianca,aws,axa,azure,baby,baidu,banamex,bananarepublic,band,bank,bar,barcelona,barclaycard,barclays,barefoot,bargains,baseball,basketball,bauhaus,bayern,bbc,bbt,bbva,bcg,bcn,beats,beauty,beer,bentley,berlin,best,bestbuy,bet,bharti,bible,bid,bike,bing,bingo,bio,black,blackfriday,blockbuster,blog,bloomberg,blue,bms,bmw,bnpparibas,boats,boehringer,bofa,bom,bond,boo,book,booking,bosch,bostik,boston,bot,boutique,box,bradesco,bridgestone,broadway,broker,brother,brussels,budapest,bugatti,build,builders,business,buy,buzz,bzh,cab,cafe,cal,call,calvinklein,cam,camera,camp,cancerresearch,canon,capetown,capital,capitalone,car,caravan,cards,care,career,careers,cars,casa,case,cash,casino,catering,catholic,cba,cbn,cbre,cbs,center,ceo,cern,cfa,cfd,chanel,channel,charity,chase,chat,cheap,chintai,christmas,chrome,church,cipriani,circle,cisco,citadel,citi,citic,city,cityeats,claims,cleaning,click,clinic,clinique,clothing,cloud,club,clubmed,coach,codes,coffee,college,cologne,comcast,commbank,community,company,compare,computer,comsec,condos,construction,consulting,contact,contractors,cooking,cookingchannel,cool,corsica,country,coupon,coupons,courses,cpa,credit,creditcard,creditunion,cricket,crown,crs,cruise,cruises,csc,cuisinella,cymru,cyou,dabur,dad,dance,data,date,dating,datsun,day,dclk,dds,deal,dealer,deals,degree,delivery,dell,deloitte,delta,democrat,dental,dentist,desi,design,dev,dhl,diamonds,diet,digital,direct,directory,discount,discover,dish,diy,dnp,docs,doctor,dog,domains,dot,download,drive,dtv,dubai,dunlop,dupont,durban,dvag,dvr,earth,eat,eco,edeka,education,email,emerck,energy,engineer,engineering,enterprises,epson,equipment,ericsson,erni,esq,estate,etisalat,eurovision,eus,events,exchange,expert,exposed,express,extraspace,fage,fail,fairwinds,faith,family,fan,fans,farm,farmers,fashion,fast,fedex,feedback,ferrari,ferrero,fiat,fidelity,fido,film,final,finance,financial,fire,firestone,firmdale,fish,fishing,fit,fitness,flickr,flights,flir,florist,flowers,fly,foo,food,foodnetwork,football,ford,forex,forsale,forum,foundation,fox,free,fresenius,frl,frogans,frontdoor,frontier,ftr,fujitsu,fun,fund,furniture,futbol,fyi,gal,gallery,gallo,gallup,game,games,gap,garden,gay,gbiz,gdn,gea,gent,genting,george,ggee,gift,gifts,gives,giving,glass,gle,global,globo,gmail,gmbh,gmo,gmx,godaddy,gold,goldpoint,golf,goo,goodyear,goog,google,gop,got,grainger,graphics,gratis,green,gripe,grocery,group,guardian,gucci,guge,guide,guitars,guru,hair,hamburg,hangout,haus,hbo,hdfc,hdfcbank,health,healthcare,help,helsinki,here,hermes,hgtv,hiphop,hisamitsu,hitachi,hiv,hkt,hockey,holdings,holiday,homedepot,homegoods,homes,homesense,honda,horse,hospital,host,hosting,hot,hoteles,hotels,hotmail,house,how,hsbc,hughes,hyatt,hyundai,ibm,icbc,ice,icu,ieee,ifm,ikano,imamat,imdb,immo,immobilien,inc,industries,infiniti,ing,ink,institute,insurance,insure,international,intuit,investments,ipiranga,irish,ismaili,ist,istanbul,itau,itv,jaguar,java,jcb,jeep,jetzt,jewelry,jio,jll,jmp,jnj,joburg,jot,joy,jpmorgan,jprs,juegos,juniper,kaufen,kddi,kerryhotels,kerrylogistics,kerryproperties,kfh,kia,kids,kim,kinder,kindle,kitchen,kiwi,koeln,komatsu,kosher,kpmg,kpn,krd,kred,kuokgroup,kyoto,lacaixa,lamborghini,lamer,lancaster,lancia,land,landrover,lanxess,lasalle,lat,latino,latrobe,law,lawyer,lds,lease,leclerc,lefrak,legal,lego,lexus,lgbt,lidl,life,lifeinsurance,lifestyle,lighting,like,lilly,limited,limo,lincoln,linde,link,lipsy,live,living,llc,llp,loan,loans,locker,locus,loft,lol,london,lotte,lotto,love,lpl,lplfinancial,ltd,ltda,lundbeck,luxe,luxury,macys,madrid,maif,maison,makeup,man,management,mango,map,market,marketing,markets,marriott,marshalls,maserati,mattel,mba,mckinsey,med,media,meet,melbourne,meme,memorial,men,menu,merckmsd,miami,microsoft,mini,mint,mit,mitsubishi,mlb,mls,mma,mobile,moda,moe,moi,mom,monash,money,monster,mormon,mortgage,moscow,moto,motorcycles,mov,movie,msd,mtn,mtr,music,mutual,nab,nagoya,natura,navy,nba,nec,netbank,netflix,network,neustar,new,news,next,nextdirect,nexus,nfl,ngo,nhk,nico,nike,nikon,ninja,nissan,nissay,nokia,northwesternmutual,norton,now,nowruz,nowtv,nra,nrw,ntt,nyc,obi,observer,office,okinawa,olayan,olayangroup,oldnavy,ollo,omega,one,ong,onl,online,ooo,open,oracle,orange,organic,origins,osaka,otsuka,ott,ovh,page,panasonic,paris,pars,partners,parts,party,passagens,pay,pccw,pet,pfizer,pharmacy,phd,philips,phone,photo,photography,photos,physio,pics,pictet,pictures,pid,pin,ping,pink,pioneer,pizza,place,play,playstation,plumbing,plus,pnc,pohl,poker,politie,porn,pramerica,praxi,press,prime,prod,productions,prof,progressive,promo,properties,property,protection,pru,prudential,pub,pwc,qpon,quebec,quest,racing,radio,read,realestate,realtor,realty,recipes,red,redstone,redumbrella,rehab,reise,reisen,reit,reliance,ren,rent,rentals,repair,report,republican,rest,restaurant,review,reviews,rexroth,rich,richardli,ricoh,ril,rio,rip,rocher,rocks,rodeo,rogers,room,rsvp,rugby,ruhr,run,rwe,ryukyu,saarland,safe,safety,sakura,sale,salon,samsclub,samsung,sandvik,sandvikcoromant,sanofi,sap,sarl,sas,save,saxo,sbi,sbs,sca,scb,schaeffler,schmidt,scholarships,school,schule,schwarz,science,scot,search,seat,secure,security,seek,select,sener,services,ses,seven,sew,sex,sexy,sfr,shangrila,sharp,shaw,shell,shia,shiksha,shoes,shop,shopping,shouji,show,showtime,silk,sina,singles,site,ski,skin,sky,skype,sling,smart,smile,sncf,soccer,social,softbank,software,sohu,solar,solutions,song,sony,soy,spa,space,sport,spot,srl,stada,staples,star,statebank,statefarm,stc,stcgroup,stockholm,storage,store,stream,studio,study,style,sucks,supplies,supply,support,surf,surgery,suzuki,swatch,swiss,sydney,systems,tab,taipei,talk,taobao,target,tatamotors,tatar,tattoo,tax,taxi,tci,tdk,team,tech,technology,temasek,tennis,teva,thd,theater,theatre,tiaa,tickets,tienda,tiffany,tips,tires,tirol,tjmaxx,tjx,tkmaxx,tmall,today,tokyo,tools,top,toray,toshiba,total,tours,town,toyota,toys,trade,trading,training,travel,travelchannel,travelers,travelersinsurance,trust,trv,tube,tui,tunes,tushu,tvs,ubank,ubs,unicom,university,uno,uol,ups,vacations,vana,vanguard,vegas,ventures,verisign,versicherung,vet,viajes,video,vig,viking,villas,vin,vip,virgin,visa,vision,viva,vivo,vlaanderen,vodka,volkswagen,volvo,vote,voting,voto,voyage,vuelos,wales,walmart,walter,wang,wanggou,watch,watches,weather,weatherchannel,webcam,weber,website,wedding,weibo,weir,whoswho,wien,wiki,williamhill,win,windows,wine,winners,wme,wolterskluwer,woodside,work,works,world,wow,wtc,wtf,xbox,xerox,xfinity,xihuan,xin,xn--11b4c3d,xn--1ck2e1b,xn--1qqw23a,xn--30rr7y,xn--3bst00m,xn--3ds443g,xn--3pxu8k,xn--42c2d9a,xn--45q11c,xn--4gbrim,xn--55qw42g,xn--55qx5d,xn--5su34j936bgsg,xn--5tzm5g,xn--6frz82g,xn--6qq986b3xl,xn--80adxhks,xn--80aqecdr1a,xn--80asehdb,xn--80aswg,xn--8y0a063a,xn--9dbq2a,xn--9et52u,xn--9krt00a,xn--b4w605ferd,xn--bck1b9a5dre4c,xn--c1avg,xn--c2br7g,xn--cck2b3b,xn--cckwcxetd,xn--cg4bki,xn--czr694b,xn--czrs0t,xn--czru2d,xn--d1acj3b,xn--eckvdtc9d,xn--efvy88h,xn--fct429k,xn--fhbei,xn--fiq228c5hs,xn--fiq64b,xn--fjq720a,xn--flw351e,xn--fzys8d69uvgm,xn--g2xx48c,xn--gckr3f0f,xn--gk3at1e,xn--hxt814e,xn--i1b6b1a6a2e,xn--imr513n,xn--io0a7i,xn--j1aef,xn--jlq480n2rg,xn--jlq61u9w7b,xn--jvr189m,xn--kcrx77d1x4a,xn--kput3i,xn--mgba3a3ejt,xn--mgba7c0bbn0a,xn--mgbaakc7dvf,xn--mgbab2bd,xn--mgbca7dzdo,xn--mgbi4ecexp,xn--mgbt3dhd,xn--mk1bu44c,xn--mxtq1m,xn--ngbc5azd,xn--ngbe9e0a,xn--ngbrx,xn--nqv7f,xn--nqv7fs00ema,xn--nyqy26a,xn--otu796d,xn--p1acf,xn--pssy2u,xn--q9jyb4c,xn--qcka1pmc,xn--rhqv96g,xn--rovu88b,xn--ses554g,xn--t60b56a,xn--tckwe,xn--tiq49xqyj,xn--unup4y,xn--vermgensberater-ctb,xn--vermgensberatung-pwb,xn--vhquv,xn--vuq861b,xn--w4r85el8fhu5dnra,xn--w4rs40l,xn--xhq521b,xn--zfr164b,xyz,yachts,yahoo,yamaxun,yandex,yodobashi,yoga,yokohama,you,youtube,yun,zappos,zara,zero,zip,zone,zuerich";

    // node_modules/parse-domain/serialized-tries/private.js
    var private_default =
      "ua>cc,inf,ltd,cx,biz,co,pp,v<to>611,oya,rdv,vpnplus,quickconnect>direct<nyan<us>graphox,cloudns,drud,is-by,land-4-sale,stuff-4-sale,enscaled>phx<mircloud,freeddns,golffan,noip,pointto,platterp,de>lib<<com>devcdnaccesso>*<adobeaemcloud>dev>*<<kasserver,amazonaws>compute>*<compute-1>*<us-east-1>dualstack>s3<<elb>*<s3,s3-ap-northeast-1,s3-ap-northeast-2,s3-ap-south-1,s3-ap-southeast-1,s3-ap-southeast-2,s3-ca-central-1,s3-eu-central-1,s3-eu-west-1,s3-eu-west-2,s3-eu-west-3,s3-external-1,s3-fips-us-gov-west-1,s3-sa-east-1,s3-us-gov-west-1,s3-us-east-2,s3-us-west-1,s3-us-west-2,ap-northeast-2>s3,dualstack>s3<s3-website<ap-south-1>s3,dualstack>s3<s3-website<ca-central-1>s3,dualstack>s3<s3-website<eu-central-1>s3,dualstack>s3<s3-website<eu-west-2>s3,dualstack>s3<s3-website<eu-west-3>s3,dualstack>s3<s3-website<us-east-2>s3,dualstack>s3<s3-website<ap-northeast-1>dualstack>s3<<ap-southeast-1>dualstack>s3<<ap-southeast-2>dualstack>s3<<eu-west-1>dualstack>s3<<sa-east-1>dualstack>s3<<s3-website-us-east-1,s3-website-us-west-1,s3-website-us-west-2,s3-website-ap-northeast-1,s3-website-ap-southeast-1,s3-website-ap-southeast-2,s3-website-eu-west-1,s3-website-sa-east-1<elasticbeanstalk>ap-northeast-1,ap-northeast-2,ap-northeast-3,ap-south-1,ap-southeast-1,ap-southeast-2,ca-central-1,eu-central-1,eu-west-1,eu-west-2,eu-west-3,sa-east-1,us-east-1,us-east-2,us-gov-west-1,us-west-1,us-west-2<awsglobalaccelerator,siiites,appspacehosted,appspaceusercontent,on-aptible,myasustor,balena-devices,betainabox,boutir,bplaced,cafjs,br,cn,de,eu,jpn,mex,ru,sa,uk,us,za,ar,hu,kr,no,qc,uy,africa,gr,co,jdevcloud,wpdevcloud,cloudcontrolled,cloudcontrolapp,trycloudflare,customer-oci>*,oci>*<ocp>*<ocs>*<<dattolocal,dattorelay,dattoweb,mydatto,builtwithdark,datadetect>demo,instance<ddns5,drayddns,dreamhosters,mydrobo,dyndns-at-home,dyndns-at-work,dyndns-blog,dyndns-free,dyndns-home,dyndns-ip,dyndns-mail,dyndns-office,dyndns-pics,dyndns-remote,dyndns-server,dyndns-web,dyndns-wiki,dyndns-work,blogdns,cechire,dnsalias,dnsdojo,doesntexist,dontexist,doomdns,dyn-o-saur,dynalias,est-a-la-maison,est-a-la-masion,est-le-patron,est-mon-blogueur,from-ak,from-al,from-ar,from-ca,from-ct,from-dc,from-de,from-fl,from-ga,from-hi,from-ia,from-id,from-il,from-in,from-ks,from-ky,from-ma,from-md,from-mi,from-mn,from-mo,from-ms,from-mt,from-nc,from-nd,from-ne,from-nh,from-nj,from-nm,from-nv,from-oh,from-ok,from-or,from-pa,from-pr,from-ri,from-sc,from-sd,from-tn,from-tx,from-ut,from-va,from-vt,from-wa,from-wi,from-wv,from-wy,getmyip,gotdns,hobby-site,homelinux,homeunix,iamallama,is-a-anarchist,is-a-blogger,is-a-bookkeeper,is-a-bulls-fan,is-a-caterer,is-a-chef,is-a-conservative,is-a-cpa,is-a-cubicle-slave,is-a-democrat,is-a-designer,is-a-doctor,is-a-financialadvisor,is-a-geek,is-a-green,is-a-guru,is-a-hard-worker,is-a-hunter,is-a-landscaper,is-a-lawyer,is-a-liberal,is-a-libertarian,is-a-llama,is-a-musician,is-a-nascarfan,is-a-nurse,is-a-painter,is-a-personaltrainer,is-a-photographer,is-a-player,is-a-republican,is-a-rockstar,is-a-socialist,is-a-student,is-a-teacher,is-a-techie,is-a-therapist,is-an-accountant,is-an-actor,is-an-actress,is-an-anarchist,is-an-artist,is-an-engineer,is-an-entertainer,is-certified,is-gone,is-into-anime,is-into-cars,is-into-cartoons,is-into-games,is-leet,is-not-certified,is-slick,is-uberleet,is-with-theband,isa-geek,isa-hockeynut,issmarterthanyou,likes-pie,likescandy,neat-url,saves-the-whales,selfip,sells-for-less,sells-for-u,servebbs,simple-url,space-to-rent,teaches-yoga,writesthisblog,digitaloceanspaces>*<ddnsfree,ddnsgeek,giize,gleeze,kozow,loseyourip,ooguy,theworkpc,mytuleap,tuleap-partners,evennode>eu-1,eu-2,eu-3,eu-4,us-1,us-2,us-3,us-4<onfabrica,fbsbx>apps<fastly-terrarium,fastvps-server,mydobiss,firebaseapp,fldrv,forgeblocks,framercanvas,freebox-os,freeboxos,freemyip,gentapps,gentlentapis,githubusercontent,0emm>*<appspot>r>*<<codespot,googleapis,googlecode,pagespeedmobilizer,publishproxy,withgoogle,withyoutube,blogspot,awsmppl,herokuapp,herokussl,myravendb,impertrixcdn,impertrix,smushcdn,wphostedmail,wpmucdn,pixolino,amscompute,clicketcloud,dopaas,hidora,hosted-by-previder>paas<hosteur>rag-cloud,rag-cloud-ch<ik-server>jcloud,jcloud-ver-jpc<jelastic>demo<kilatiron,massivegrid>paas<wafaicloud>jed,lon,ryd<joyent>cns>*<<lpusercontent,lmpm>app<linode>members,nodebalancer>*<<linodeobjects>*<linodeusercontent>ip<barsycenter,barsyonline,mazeplay,miniserver,meteorapp>eu<hostedpi,mythic-beasts>customer,caracal,fentiger,lynx,ocelot,oncilla,onza,sphinx,vs,x,yali<nospamproxy>cloud<4u,nfshost,001www,ddnslive,myiphost,blogsyte,ciscofreak,damnserver,ditchyourip,dnsiskinky,dynns,geekgalaxy,health-carereform,homesecuritymac,homesecuritypc,myactivedirectory,mysecuritycamera,net-freaks,onthewifi,point2this,quicksytes,securitytactics,serveexchange,servehumour,servep2p,servesarcasm,stufftoread,unusualperson,workisboring,3utilities,ddnsking,myvnc,servebeer,servecounterstrike,serveftp,servegame,servehalflife,servehttp,serveirc,servemp3,servepics,servequake,observableusercontent>static<orsites,operaunite,authgear-staging,authgearapps,skygearapp,outsystemscloud,ownprovider,pgfog,pagefrontapp,pagexl,paywhirl>*<gotpantheon,platter-app,pleskns,postman-echo,prgmr>xen<pythonanywhere>eu<qualifioapp,qbuser,qa2,dev-myqnapcloud,alpha-myqnapcloud,myqnapcloud,quipelements>*<rackmaze,rhcloud,render>app<onrender,logoip,scrysec,firewall-gateway,myshopblocks,myshopify,shopitsite,1kapp,appchizi,applinzi,sinaapp,vipsinaapp,bounty-full>alpha,beta<try-snowplow,stackhero-network,playstation-cloud,myspreadshop,stdlib>api<temp-dns,dsmynas,familyds,tb-hosting>site<reservd,thingdustdata,bloxcms,townnews-staging,typeform>pro<hk,wafflecell,idnblogger,indowapblog,reserve-online,hotelwithflight,remotewd,wiardweb>pages<woltlab-demo,wpenginepowered>js<wixsite,xnbay>u2,u2-local<yolasite<live>hlx<net>adobeaemcloud,alwaysdata,cloudfront,t3l3p0rt,appudo,atlassian-dev>prod>cdn<<myfritz,onavstack,shopselect,blackbaudcdn,boomla,bplaced,square7,gb,hu,jp,se,uk,in,clickrising,cloudaccess,cdn77-ssl,cdn77>r<feste-ip,knx-server,static-access,cryptonomic>*<dattolocal,mydatto,debian,bitbridge,at-band-camp,blogdns,broke-it,buyshouses,dnsalias,dnsdojo,does-it,dontexist,dynalias,dynathome,endofinternet,from-az,from-co,from-la,from-ny,gets-it,ham-radio-op,homeftp,homeip,homelinux,homeunix,in-the-band,is-a-chef,is-a-geek,isa-geek,kicks-ass,office-on-the,podzone,scrapper-site,selfip,sells-it,servebbs,serveftp,thruhere,webhop,definima,casacam,dynu,dynv6,twmail,ru,channelsdvr>u<fastlylb>map<fastly>freetls,map,prod>a,global<ssl>a,b,global<<edgeapp,flynnhosting,cdn-edges,cloudfunctions,moonscale,in-dsl,in-vpn,ipifony,iobb,cloudjiffy>fra1-de,west1-us<elastx>jls-sto1,jls-sto2,jls-sto3<faststacks,massivegrid>paas>fr-1,lon-1,lon-2,ny-1,ny-2,sg-1<<saveincloud>jelastic,nordeste-idc<scaleforce>j<tsukaeru>jelastic<kinghost,uni5,krellian,barsy,memset,azurewebsites,azure-mobile,cloudapp,azurestaticapps>centralus,eastasia,eastus2,westeurope,westus2<dnsup,hicam,now-dns,ownip,vpndns,eating-organic,mydissent,myeffect,mymediapc,mypsx,mysecuritycamera,nhlfan,no-ip,pgafan,privatizehealthinsurance,bounceme,ddns,redirectme,serveblog,serveminecraft,sytes,cloudycluster,ovh>webpaas>*<hosting>*<<bar0,bar1,bar2,rackmaze,schokokeks,firewall-gateway,seidat,senseering,siteleaf,vps-host>jelastic>atl,njs,ric<<myspreadshop,srcf>soc,user<supabase,dsmynas,familyds,tailscale>beta<ts,torproject>pages<fastblog,reserve-online,community-pro,meinforum,yandexcloud>storage,website<za<page>hlx,hlx3,codeberg,pdns,plesk,prvcy,magnet<pl>beep,ecommerce-shop,shoparena,homesklep,sdscloud,unicloud,krasnik,leczna,lubartow,lublin,poniatowa,swidnik,co,art,gliwice,krakow,poznan,wroc,zakopane,myspreadshop,gda,gdansk,gdynia,med,sopot<ca>barsy,awdev>*<co,blogspot,no-ip,myspreadshop<estate>compute>*<<network>alces>*<co,arvo,azimuth,tlon<org>altervista,amune>tele<pimienta,poivron,potager,sweetpepper,ae,us,certmgr,cdn77>c,rsc<cdn77-secure>origin>ssl<<cloudns,duckdns,tunk,dyndns>go,home<blogdns,blogsite,boldlygoingnowhere,dnsalias,dnsdojo,doesntexist,dontexist,doomdns,dvrdns,dynalias,endofinternet,endoftheinternet,from-me,game-host,gotdns,hobby-site,homedns,homeftp,homelinux,homeunix,is-a-bruinsfan,is-a-candidate,is-a-celticsfan,is-a-chef,is-a-geek,is-a-knight,is-a-linux-user,is-a-patsfan,is-a-soxfan,is-found,is-lost,is-saved,is-very-bad,is-very-evil,is-very-good,is-very-nice,is-very-sweet,isa-geek,kicks-ass,misconfused,podzone,readmyblog,selfip,sellsyourhome,servebbs,serveftp,servegame,stuff-4-sale,webhop,ddnss,accesscam,camdvr,freeddns,mywire,webredirect,eu>al,asso,at,au,be,bg,ca,cd,ch,cn,cy,cz,de,dk,edu,ee,es,fi,fr,gr,hr,hu,ie,il,in,int,is,it,jp,kr,lt,lu,lv,mc,me,mk,mt,my,net,ng,nl,no,nz,paris,pl,pt,q-a,ro,ru,se,si,sk,tr,uk,us<twmail,fedorainfracloud,fedorapeople,fedoraproject>cloud,os>app<stg>os>app<<<freedesktop,hepforge,in-dsl,in-vpn,js,barsy,mayfirst,mozilla-iot,bmoattachments,dynserv,now-dns,cable-modem,collegefan,couchpotatofries,mlbfan,mysecuritycamera,nflfan,read-books,ufcfan,hopto,myftp,no-ip,zapto,httpbin,pubtls,my-firewall,myfirewall,spdns,small-web,dsmynas,familyds,teckids>s3<tuxfamily,diskstation,hk,wmflabs,toolforge,wmcloud,za<cn>com>amazonaws>compute>*<eb>cn-north-1,cn-northwest-1<elb>*<cn-north-1>s3<<<instantcloud<io>apigee,b-data,backplaneapp,banzaicloud>app,backyards>*<<bitbucket,bluebite,boxfuse,browsersafetymark,bigv>uk0<cleverapps,dappnode>dyndns<dedyn,drud,definima,fh-muenster,shw,forgerock>id<ghost,github,gitlab,lolipop,hasura-app,hostyhosting,moonscale>*<beebyte>paas<beebyteapp>sekd1<jele,unispace>cloud-fr1<webthings,loginline,barsy,azurecontainer>*<ngrok,nodeart>stage<nid,pantheonsite,dyn53,pstmn>mock<protonet,qoto,qcx>sys>*<<vaporcloud,vbrplsbx>g<on-k3s>*<on-rio>*<readthedocs,resindevice,resinstaging>devices<hzc,sandcats,shiftcrypto,shiftedit,mo-siemens,lair>apps<stolos>*<spacekit,utwente,s5y>*<edugit,telebit,thingdust>dev>cust,reservd<disrec>cust,reservd<prod>cust<testing>cust,reservd<<tickets,upli,2038,wedeploy,editorx,basicserver,virtualserver<jp>ne>aseinet>user<gehirn<buyshop,fashionstore,handcrafted,kawaiishop,supersale,theshop,usercontent,blogspot<vc>gv>d<0e<eus>party>user<<ws>advisor>*<cloud66,dyndns,mypets<ba>rs,blogspot<cloud>banzai>*<elementor,encoway>eu<statics>*<ravendb,axarnet>es-1<diadem,jelastic>vip<jele,jenv-aruba>aruba>eur>it1<<it1<keliweb>cs<oxa>tn,uk<primetel>uk<reclaim>ca,uk,us<trendhosting>ch,de<jotelulu,kuleuven,linkyard,magentosite>*<perspecta,vapor,on-rancher>*<sensiosite>*<trafficplex,urown,voorloper<ec>base,official<shop>base,hoplix,barsy<la>bnr,c<je>of<ch>square7,blogspot,flow>ae>alp1<appengine<linkyard-cloud,dnsking,gotdns,myspreadshop,firenet>*,svc>*<<12hp,2ix,4lima,lima-city<de>bplaced,square7,com,cosidns>dyn<dynamisches-dns,dnsupdater,internet-dns,l-o-g-i-n,dnshome,fuettertdasnetz,isteingeek,istmein,lebtimnetz,leitungsen,traeumtgerade,ddnss>dyn,dyndns<dyndns1,dyn-ip24,home-webserver>dyn<myhome-server,frusky>*<goip,blogspot,xn--gnstigbestellen-zvb,xn--gnstigliefern-wob,hs-heilbronn>it>pages<<dyn-berlin,in-berlin,in-brb,in-butter,in-dsl,in-vpn,mein-iserv,schulserver,test-iserv,keymachine,git-repos,lcube-server,svn-repos,barsy,logoip,firewall-gateway,my-gateway,my-router,spdns,speedpartner>customer<myspreadshop,taifun-dns,12hp,2ix,4lima,lima-city,dd-dns,dray-dns,draydns,dyn-vpn,dynvpn,mein-vigor,my-vigor,my-wan,syno-ds,synology-diskstation,synology-ds,uberspace>*<virtualuser,virtual-user,community-pro,diskussionsbereich<rs>brendly>shop<blogspot,ua,ox<uk>co>bytemark>dh,vm<blogspot,layershift>j<barsy,barsyonline,retrosnub>cust<nh-serv,no-ip,wellbeingzone,adimo,myspreadshop,gwiddle<conn,copro,hosp,gov>service,homeoffice<pymnt,org>glug,lug,lugs,affinitylottery,raffleentry,weeklylottery<barsy<eu>mycd,cloudns,dogado>jelastic<barsy,wellbeingzone,spdns,transurl>*<diskstation<ac>drr<ai>uwu<co>carrd,crd,otap>*<com>blogspot<leadpages,lpages,mypi,n4t,repl>id<supabase<mp>ju<se>com,blogspot,conf,iopsys,itcouldbewor,myspreadshop,paba>su<<bz>za,gsj<in>web,cloudns,blogspot,barsy,supabase<basketball>aus,nz<am>radio,blogspot,neko,nyaa<fm>radio<group>discourse<team>discourse,jelastic<app>clerk,clerkstage,wnext,platform0,ondigitalocean,edgecompute,fireweb,onflashdrive,framer,run>a<web,hasura,loginline,netlify,developer>*<noop,northflank>*<telebit,vercel,bookonline<dev>lcl>*<lclstage>*<stg>*<stgstage>*<pages,workers,curv,deno,deno-staging,fly,githubpreview,gateway>*<iserv,loginline,mediatech,platter-app,shiftcrypto,vercel,webhare>*<<me>c66,daplie>localhost<edgestack,couk,ukco,filegear,filegear-au,filegear-de,filegear-gb,filegear-ie,filegear-jp,filegear-sg,glitch,ravendb,lohmus,barsy,mcpe,mcdir,soundcast,tcp4,brasilia,ddns,dnsfor,hopto,loginto,noip,webhop,vp4,diskstation,dscloud,i234,myds,synology,tbits,wbq,wedeploy,yombo,nohost<zone>cloud66,hs,triton>*<lima<host>cloudaccess,freesite,fastvps,myfast,tempurl,wpmudev,jele,mircloud,pcloud,half<site>cloudera>*<cyon,fnwk,folionetwork,fastvps,jele,lelux,loginline,barsy,mintere,omniwe,opensocial,platformsh>*<tst>*<byen,srht,novecore<cz>co,realm,e4,blogspot,metacentrum>cloud>*<custom<muni>cloud>flt,usr<<<asia>cloudns<biz>cloudns,jozi,dyndns,for-better,for-more,for-some,for-the,selfip,webhop,orx,mmafan,myftp,no-ip,dscloud<club>cloudns,jele,barsy,pony<cc>cloudns,ftpaccess,game-server,myphotos,scrapping,twmail,csx,fantasyleague,spawn>instances<<info>cloudns,dynamic-dns,dyndns,barrel-of-knowledge,barrell-of-knowledge,for-our,groks-the,groks-this,here-for-more,knowsitall,selfip,webhop,barsy,mayfirst,forumz,nsupdate,dvrcam,ilovecollege,no-ip,dnsupdate,v-info<pro>cloudns,dnstrace>bci<barsy<pw>cloudns,x443<gdn>cnpy<nl>co,hosting-cluster,blogspot,khplay,myspreadshop,transurl>*<cistron,demon<no>co,blogspot,myspreadshop<be>webhosting,blogspot,interhostsolutions>cloud<kuleuven>ezproxy<myspreadshop,transurl>*<<ru>ac,edu,gov,int,mil,test,eurodir,adygeya,bashkiria,bir,cbg,com,dagestan,grozny,kalmykia,kustanai,marine,mordovia,msk,mytis,nalchik,nov,pyatigorsk,spb,vladikavkaz,vladimir,blogspot,na4u,mircloud,regruhosting>jelastic<myjino>hosting>*<landing>*<spectrum>*<vps>*<<cldmail>hb<mcdir>vps<mcpre,net,org,pp,lk3,ras<is>cupcake,blogspot<link>cyon,mypep,dweb>*<<dk>biz,co,firm,reg,store,blogspot,myspreadshop<earth>dapps>*,bzz>*<<<id>my>rss>*<<flap,co>blogspot<forte,bloger,wblog<solutions>diher>*<<th>online,shop<sh>bip,hashbang,platform>bc,ent,eu,us<now,vxl,wedeploy<fi>dy,blogspot,xn--hkkinen-5wa,iki,cloudplatform>fi<datacenter>demo,paas<myspreadshop<tv>dyndns,better-than,on-the-web,worse-than<cx>ath,info<name>her>forgot<his>forgot<<nu>merseine,mine,shacknet,enterprisecloud<rocks>myddns,lima-city,webspace<xyz>blogsite,localzone,crafting,zapto,telebit>*<<online>eero,eero-stage,barsy<cool>elementor,de<fr>en-root,fbx-os,fbxos,freebox-os,freeboxos,blogspot,goupile,on-web,chirurgiens-dentistes-en-france,myspreadshop,ynh<one>onred>staging<for,under,service,homelink<tw>com>mymailer<url,blogspot<su>abkhazia,adygeya,aktyubinsk,arkhangelsk,armenia,ashgabad,azerbaijan,balashov,bashkiria,bryansk,bukhara,chimkent,dagestan,east-kazakhstan,exnet,georgia,grozny,ivanovo,jambyl,kalmykia,kaluga,karacol,karaganda,karelia,khakassia,krasnodar,kurgan,kustanai,lenug,mangyshlak,mordovia,msk,murmansk,nalchik,navoi,north-kazakhstan,nov,obninsk,penza,pokrovsk,sochi,spb,tashkent,termez,togliatti,troitsk,tselinograd,tula,tuva,vladikavkaz,vladimir,vologda<space>myfast,uber,xs4all<il>co>ravpage,blogspot,tabitorder<<at>funkfeuer>wien<futurecms>*,ex>*<in>*<<futurehosting,futuremailing,ortsinfo>ex>*<kunden>*<<co>blogspot<biz,info,priv,myspreadshop,12hp,2ix,4lima,lima-city<ms>lab,minisite<si>gitapp,gitpage,blogspot<community>nog,ravendb,myforum<ro>co,shop,blogspot,barsy<digital>cloudapps>london<<im>ro<goog>cloud,translate,usercontent>*<<ae>blogspot<al>blogspot<bg>blogspot,barsy<bj>blogspot<cf>blogspot<cl>blogspot<ke>co>blogspot<<nz>co>blogspot<<za>co>blogspot<<ar>com>blogspot<<au>com>blogspot,cloudlets>mel<myspreadshop<<br>com>blogspot,virtualcloud>scale>users<<<leg>ac,al,am,ap,ba,ce,df,es,go,ma,mg,ms,mt,pa,pb,pe,pi,pr,rj,rn,ro,rr,rs,sc,se,sp,to<<by>com>blogspot<mycloud,mediatech<cy>com>blogspot,scaleforce>j<<<ee>com>blogspot<<eg>com>blogspot<<es>com>blogspot<myspreadshop<mt>com>blogspot<<ng>com>blogspot<col,firm,gen,ltd,ngo<tr>com>blogspot<<uy>com>blogspot<<cv>blogspot<gr>blogspot<hk>blogspot,secaas,ltd,inc<hr>blogspot,free<hu>blogspot<ie>blogspot,myspreadshop<it>blogspot,neen>jc<tim>open>jelastic>cloud<<<16-b,32-b,64-b,myspreadshop,syncloud<kr>blogspot<li>blogspot,caa<lt>blogspot<lu>blogspot<md>blogspot,at,de,jp,to<mk>blogspot<mr>blogspot<mx>blogspot<my>blogspot<pe>blogspot<pt>blogspot<qa>blogspot<re>blogspot<sg>blogspot,enscaled<sk>blogspot<sn>blogspot<td>blogspot<ug>blogspot<vn>blogspot<ci>fin,nl<run>hs,development,ravendb,servers,code>*<repl<gl>biz,xx<scot>edu,gov>service<<so>sch<yt>org<kz>jcloud,kazteleport>upaas<<tn>orangecloud<gg>kaas,cya,panel>daemon<<systems>knightpoint<events>koobin,co<krd>co,edu<business>co<education>co<financial>co<place>co<technology>co<bs>we<services>loginline<menu>barsy<mobi>barsy,dscloud<pub>barsy<support>barsy<vu>cn,blog,dev,me<health>hra<casa>nabu>ui<<fashion>of<london>in,of<marketing>from,with<men>for,repair<mom>and,for<sale>for<win>that<work>from,to<news>noticeable<top>now-dns,ntdll<ovh>nerdpol<mn>nyc<lol>omg<hosting>opencraft<pm>own<codes>owo>*<<lc>oy<bn>co<today>prequalifyme<builders>cloudsite<edu>rit>git-pages<<xn--p1acf>xn--90amc,xn--j1aef,xn--j1ael8b,xn--h1ahn,xn--j1adp,xn--c1avg,xn--80aaa0cvac,xn--h1aliz,xn--90a1af,xn--41a<store>sellfy,shopware,storebase<land>static>dev,sites<<farm>storj<pictures>1337<rip>clan<management>router<ax>be,cat,es,eu,gg,mc,us,xy<gp>app<gt>blog,de,to<gy>be<hn>cc<kg>blog,io,jp,tv,uk,us<ls>de<porn>indie<tc>ch,me,we<vg>at<academy>official<faith>ybo<party>ybo<review>ybo<science>ybo<trade>ybo<st>noho<design>bss";

    // node_modules/parse-domain/build/trie/characters.js
    var UP = "<";
    var SAME = ",";
    var DOWN = ">";
    var RESET = "|";
    var WILDCARD = "*";
    var EXCEPTION = "!";

    // node_modules/parse-domain/build/trie/look-up.js
    // @ts-ignore
    var lookUpTldsInTrie = (labels, trie) => {
      const labelsToCheck = labels.slice();
      const tlds = [];
      let node = trie;
      while (labelsToCheck.length !== 0) {
        const label = labelsToCheck.pop();
        const labelLowerCase = label.toLowerCase();
        if (node.children.has(WILDCARD)) {
          if (node.children.has(EXCEPTION + labelLowerCase)) {
            break;
          }
          node = node.children.get(WILDCARD);
        } else {
          if (node.children.has(labelLowerCase) === false) {
            break;
          }
          node = node.children.get(labelLowerCase);
        }
        tlds.unshift(label);
      }
      return tlds;
    };

    // node_modules/parse-domain/build/sanitize.js
    var LABEL_SEPARATOR = ".";
    var LABEL_LENGTH_MIN = 1;
    var LABEL_LENGTH_MAX = 63;
    var DOMAIN_LENGTH_MAX = 253;
    // var textEncoder = new TextEncoder();
    // @ts-ignore
    var Validation;
    (function (Validation2) {
      // @ts-ignore
      Validation2["Lax"] = "LAX";
      // @ts-ignore
      // @ts-ignore
      Validation2["Strict"] = "STRICT";
    })(Validation || (Validation = {}));
    // @ts-ignore
    var ValidationErrorType;
    (function (ValidationErrorType2) {
      // @ts-ignore
      ValidationErrorType2["NoHostname"] = "NO_HOSTNAME";
      // @ts-ignore
      // @ts-ignore
      ValidationErrorType2["DomainMaxLength"] = "DOMAIN_MAX_LENGTH";
      // @ts-ignore
      ValidationErrorType2["LabelMinLength"] = "LABEL_MIN_LENGTH";
      // @ts-ignore
      // @ts-ignore
      ValidationErrorType2["LabelMaxLength"] = "LABEL_MAX_LENGTH";
      // @ts-ignore
      ValidationErrorType2["LabelInvalidCharacter"] = "LABEL_INVALID_CHARACTER";
      // @ts-ignore
      ValidationErrorType2["LastLabelInvalid"] = "LAST_LABEL_INVALID";
    })(ValidationErrorType || (ValidationErrorType = {}));
    // @ts-ignore
    var SanitizationResultType;
    (function (SanitizationResultType2) {
      // @ts-ignore
      SanitizationResultType2["ValidIp"] = "VALID_IP";
      // @ts-ignore
      SanitizationResultType2["ValidDomain"] = "VALID_DOMAIN";
      // @ts-ignore
      SanitizationResultType2["Error"] = "ERROR";
    })(SanitizationResultType || (SanitizationResultType = {}));
    // @ts-ignore
    var createNoHostnameError = (input) => {
      return {
        // @ts-ignore
        type: ValidationErrorType.NoHostname,
        message: `The given input ${String(
          input
        )} does not look like a hostname.`,
        column: 1,
      };
    };
    // @ts-ignore
    var createDomainMaxLengthError = (domain, length) => {
      return {
        // @ts-ignore
        type: ValidationErrorType.DomainMaxLength,
        message: `Domain "${domain}" is too long. Domain is ${length} octets long but should not be longer than ${DOMAIN_LENGTH_MAX}.`,
        column: length,
      };
    };
    // @ts-ignore
    var createLabelMinLengthError = (label, column) => {
      const length = label.length;
      return {
        // @ts-ignore
        type: ValidationErrorType.LabelMinLength,
        message: `Label "${label}" is too short. Label is ${length} octets long but should be at least ${LABEL_LENGTH_MIN}.`,
        column,
      };
    };
    // @ts-ignore
    var createLabelMaxLengthError = (label, column) => {
      const length = label.length;
      return {
        // @ts-ignore
        type: ValidationErrorType.LabelMaxLength,
        message: `Label "${label}" is too long. Label is ${length} octets long but should not be longer than ${LABEL_LENGTH_MAX}.`,
        column,
      };
    };
    // @ts-ignore
    var createLabelInvalidCharacterError = (
      // @ts-ignore
      label,
      // @ts-ignore
      invalidCharacter,
      // @ts-ignore
      column
    ) => {
      return {
        // @ts-ignore
        type: ValidationErrorType.LabelInvalidCharacter,
        message: `Label "${label}" contains invalid character "${invalidCharacter}" at column ${column}.`,
        column,
      };
    };
    // @ts-ignore
    var createLastLabelInvalidError = (label, column) => {
      return {
        // @ts-ignore
        type: ValidationErrorType.LabelInvalidCharacter,
        message: `Last label "${label}" must not be all-numeric.`,
        column,
      };
    };
    // @ts-ignore
    var sanitize = (input, options = {}) => {
      if (typeof input !== "string") {
        return {
          // @ts-ignore
          type: SanitizationResultType.Error,
          errors: [createNoHostnameError(input)],
        };
      }
      if (input === "") {
        return {
          // @ts-ignore
          type: SanitizationResultType.ValidDomain,
          domain: input,
          labels: [],
        };
      }
      const inputTrimmedAsIp = input.replace(/^\[|]$/g, "");
      // @ts-ignore
      // const ipVersionOfInput = ipVersion(inputTrimmedAsIp);
      // if (ipVersionOfInput !== void 0) {
      //   return {
      //     // @ts-ignore
      //     type: SanitizationResultType.ValidIp,
      //     ip: inputTrimmedAsIp,
      //     ipVersion: ipVersionOfInput,
      //   };
      // }
      const lastChar = input.charAt(input.length - 1);
      const canonicalInput =
        lastChar === LABEL_SEPARATOR ? input.slice(0, -1) : input;
      // const octets = new TextEncoder().encode(canonicalInput);
      // if (octets.length > DOMAIN_LENGTH_MAX) {
      //   return {
      //     // @ts-ignore
      //     type: SanitizationResultType.Error,
      //     errors: [createDomainMaxLengthError(input, octets.length)],
      //   };
      // }
      const labels = canonicalInput.split(LABEL_SEPARATOR);
      // @ts-ignore
      const { validation = Validation.Strict } = options;
      const labelValidationErrors = validateLabels[validation](labels);
      if (labelValidationErrors.length > 0) {
        return {
          // @ts-ignore
          type: SanitizationResultType.Error,
          errors: labelValidationErrors,
        };
      }
      return {
        // @ts-ignore
        type: SanitizationResultType.ValidDomain,
        domain: input,
        labels,
      };
    };
    var validateLabels = {
      // @ts-ignore
      [Validation.Lax]: (labels) => {
        return [];
        // const labelValidationErrors = [];
        // let column = 1;
        // for (const label of labels) {
        //   const octets = textEncoder.encode(label);
        //   if (octets.length < LABEL_LENGTH_MIN) {
        //     labelValidationErrors.push(
        //       createLabelMinLengthError(label, column)
        //     );
        //   } else if (octets.length > LABEL_LENGTH_MAX) {
        //     labelValidationErrors.push(
        //       createLabelMaxLengthError(label, column)
        //     );
        //   }
        //   column += label.length + LABEL_SEPARATOR.length;
        // }
        // return labelValidationErrors;
      },
      // @ts-ignore
      [Validation.Strict]: (labels) => {
        const labelValidationErrors = [];
        let column = 1;
        let lastLabel;
        for (const label of labels) {
          const invalidCharacter = /[^\da-z-]/i.exec(label);
          if (invalidCharacter) {
            labelValidationErrors.push(
              createLabelInvalidCharacterError(
                label,
                invalidCharacter[0],
                invalidCharacter.index + 1
              )
            );
          }
          if (label.startsWith("-")) {
            labelValidationErrors.push(
              createLabelInvalidCharacterError(label, "-", column)
            );
          } else if (label.endsWith("-")) {
            labelValidationErrors.push(
              createLabelInvalidCharacterError(
                label,
                "-",
                column + label.length - 1
              )
            );
          }
          if (label.length < LABEL_LENGTH_MIN) {
            labelValidationErrors.push(
              createLabelMinLengthError(label, column)
            );
          } else if (label.length > LABEL_LENGTH_MAX) {
            labelValidationErrors.push(
              createLabelMaxLengthError(label, column)
            );
          }
          column += label.length + LABEL_SEPARATOR.length;
          lastLabel = label;
        }
        if (lastLabel !== void 0 && /[a-z-]/iu.test(lastLabel) === false) {
          labelValidationErrors.push(
            createLastLabelInvalidError(
              lastLabel,
              column - lastLabel.length - LABEL_SEPARATOR.length
            )
          );
        }
        return labelValidationErrors;
      },
    };

    // node_modules/parse-domain/build/trie/nodes.js
    var NODE_TYPE_ROOT = Symbol("ROOT");
    var NODE_TYPE_CHILD = Symbol("CHILD");
    var createRootNode = () => {
      return {
        type: NODE_TYPE_ROOT,
        children: /* @__PURE__ */ new Map(),
      };
    };
    // @ts-ignore
    var createOrGetChild = (parent, label) => {
      let child = parent.children.get(label);
      if (child === void 0) {
        child = {
          type: NODE_TYPE_CHILD,
          label,
          children: /* @__PURE__ */ new Map(),
          parent,
        };
        parent.children.set(label, child);
      }
      return child;
    };

    // node_modules/parse-domain/build/trie/parse-trie.js
    // @ts-ignore
    var parseTrie = (serializedTrie) => {
      const rootNode = createRootNode();
      let domain = "";
      let parentNode = rootNode;
      let node = rootNode;
      const addDomain = () => {
        node = createOrGetChild(parentNode, domain);
        domain = "";
      };
      for (let i = 0; i < serializedTrie.length; i++) {
        const char = serializedTrie.charAt(i);
        switch (char) {
          case SAME: {
            addDomain();
            continue;
          }
          case DOWN: {
            addDomain();
            parentNode = node;
            continue;
          }
          case RESET: {
            addDomain();
            parentNode = rootNode;
            continue;
          }
          case UP: {
            if (parentNode.type === NODE_TYPE_ROOT) {
              throw new Error(
                `Error in serialized trie at position ${i}: Cannot go up, current parent node is already root`
              );
            }
            addDomain();
            // @ts-ignore
            parentNode = parentNode.parent;
            continue;
          }
        }
        domain += char;
      }
      if (domain !== "") {
        addDomain();
      }
      return rootNode;
    };

    // node_modules/parse-domain/build/parse-domain.js
    var RESERVED_TOP_LEVEL_DOMAINS = [
      "localhost",
      "local",
      "example",
      "invalid",
      "test",
    ];
    // @ts-ignore
    var ParseResultType;
    (function (ParseResultType2) {
      // @ts-ignore
      ParseResultType2["Invalid"] = "INVALID";
      // @ts-ignore
      ParseResultType2["Ip"] = "IP";
      // @ts-ignore
      ParseResultType2["Reserved"] = "RESERVED";
      // @ts-ignore
      ParseResultType2["NotListed"] = "NOT_LISTED";
      // @ts-ignore
      ParseResultType2["Listed"] = "LISTED";
    })(ParseResultType || (ParseResultType = {}));
    // @ts-ignore
    var getAtIndex = (array, index) => {
      return index >= 0 && index < array.length ? array[index] : void 0;
    };
    // @ts-ignore
    var splitLabelsIntoDomains = (labels, index) => {
      return {
        subDomains: labels.slice(0, Math.max(0, index)),
        domain: getAtIndex(labels, index),
        topLevelDomains: labels.slice(index + 1),
      };
    };
    // @ts-ignore
    var parsedIcannTrie;
    // @ts-ignore
    var parsedPrivateTrie;
    // @ts-ignore
    var parseDomain = (hostname, options) => {
      const sanitizationResult = sanitize(hostname, options);
      // @ts-ignore
      if (sanitizationResult.type === SanitizationResultType.Error) {
        return {
          // @ts-ignore
          type: ParseResultType.Invalid,
          hostname,
          errors: sanitizationResult.errors,
        };
      }
      // @ts-ignore
      if (sanitizationResult.type === SanitizationResultType.ValidIp) {
        return {
          // @ts-ignore
          type: ParseResultType.Ip,
          // @ts-ignore
          hostname: sanitizationResult.ip,
          // @ts-ignore
          ipVersion: sanitizationResult.ipVersion,
        };
      }
      const { labels, domain } = sanitizationResult;
      if (
        hostname === "" ||
        // @ts-ignore
        RESERVED_TOP_LEVEL_DOMAINS.includes(labels[labels.length - 1])
      ) {
        return {
          // @ts-ignore
          type: ParseResultType.Reserved,
          hostname: domain,
          labels,
        };
      }
      parsedIcannTrie =
        // @ts-ignore
        parsedIcannTrie !== null && parsedIcannTrie !== void 0
          ? // @ts-ignore
            parsedIcannTrie
          : parseTrie(icann_default);
      parsedPrivateTrie =
        // @ts-ignore
        parsedPrivateTrie !== null && parsedPrivateTrie !== void 0
          ? // @ts-ignore
            parsedPrivateTrie
          : parseTrie(private_default);
      const icannTlds = lookUpTldsInTrie(labels, parsedIcannTrie);
      const privateTlds = lookUpTldsInTrie(labels, parsedPrivateTrie);
      if (icannTlds.length === 0 && privateTlds.length === 0) {
        return {
          // @ts-ignore
          type: ParseResultType.NotListed,
          hostname: domain,
          labels,
        };
      }
      const indexOfPublicSuffixDomain =
        // @ts-ignore
        labels.length - Math.max(privateTlds.length, icannTlds.length) - 1;
      // @ts-ignore
      const indexOfIcannDomain = labels.length - icannTlds.length - 1;
      return Object.assign(
        {
          // @ts-ignore
          type: ParseResultType.Listed,
          hostname: domain,
          labels,
          icann: splitLabelsIntoDomains(labels, indexOfIcannDomain),
        },
        splitLabelsIntoDomains(labels, indexOfPublicSuffixDomain)
      );
    };

    // node_modules/parse-domain/build/from-url.js
    var urlPattern = /^[a-z][*+.a-z-]+:\/\//i;
    var invalidIpv6Pattern =
      /^([a-z][*+.a-z-]+:\/\/)([^[].*:[^/?]*:[^/?]*)(.*)/i;
    var NO_HOSTNAME = Symbol("NO_HOSTNAME");
    // @ts-ignore
    var fromUrl = (urlLike) => {
      if (typeof urlLike !== "string") {
        return NO_HOSTNAME;
      }
      let url = urlLike.startsWith("//")
        ? `http:${urlLike}`
        : urlLike.startsWith("/")
        ? urlLike
        : urlPattern.test(urlLike)
        ? urlLike
        : `http://${urlLike}`;

      // NOTE: This was adding a bracket to the front of the URL, and I don't think we need it
      // url = url.replace(invalidIpv6Pattern, "$1[$2]$3");
      try {
        return extractHostname(url);
      } catch (_a) {
        return NO_HOSTNAME;
      }
    };

    function extractHostname(url: string) {
      var hostname;
      //find & remove protocol (http, ftp, etc.) and get hostname

      if (url.indexOf("//") > -1) {
        hostname = url.split("/")[2];
      } else {
        hostname = url.split("/")[0];
      }

      //find & remove port number
      hostname = hostname.split(":")[0];
      //find & remove "?"
      hostname = hostname.split("?")[0];

      return hostname;
    }

    return { parseDomain, fromUrl };
  }

  /**************************************
   * Minified JS for generating a text
   * fragment link
   *************************************/

  function getTextFragmentLink(activeTab: Chrome.Tab) {
    // NOTE: Semi-confirmed that this is blocking until the javascript is actually done
    activeTab.execute({
      javascript:
        '(()=>{"use strict";var _=["ADDRESS","ARTICLE","ASIDE","BLOCKQUOTE","BR","DETAILS","DIALOG","DD","DIV","DL","DT","FIELDSET","FIGCAPTION","FIGURE","FOOTER","FORM","H1","H2","H3","H4","H5","H6","HEADER","HGROUP","HR","LI","MAIN","NAV","OL","P","PRE","SECTION","TABLE","UL","TR","TH","TD","COLGROUP","COL","CAPTION","THEAD","TBODY","TFOOT"],C=/[\\t-\\r -#%-\\*,-\\/:;\\?@\\[-\\]_\\{\\}\\x85\\xA0\\xA1\\xA7\\xAB\\xB6\\xB7\\xBB\\xBF\\u037E\\u0387\\u055A-\\u055F\\u0589\\u058A\\u05BE\\u05C0\\u05C3\\u05C6\\u05F3\\u05F4\\u0609\\u060A\\u060C\\u060D\\u061B\\u061E\\u061F\\u066A-\\u066D\\u06D4\\u0700-\\u070D\\u07F7-\\u07F9\\u0830-\\u083E\\u085E\\u0964\\u0965\\u0970\\u0AF0\\u0DF4\\u0E4F\\u0E5A\\u0E5B\\u0F04-\\u0F12\\u0F14\\u0F3A-\\u0F3D\\u0F85\\u0FD0-\\u0FD4\\u0FD9\\u0FDA\\u104A-\\u104F\\u10FB\\u1360-\\u1368\\u1400\\u166D\\u166E\\u1680\\u169B\\u169C\\u16EB-\\u16ED\\u1735\\u1736\\u17D4-\\u17D6\\u17D8-\\u17DA\\u1800-\\u180A\\u1944\\u1945\\u1A1E\\u1A1F\\u1AA0-\\u1AA6\\u1AA8-\\u1AAD\\u1B5A-\\u1B60\\u1BFC-\\u1BFF\\u1C3B-\\u1C3F\\u1C7E\\u1C7F\\u1CC0-\\u1CC7\\u1CD3\\u2000-\\u200A\\u2010-\\u2029\\u202F-\\u2043\\u2045-\\u2051\\u2053-\\u205F\\u207D\\u207E\\u208D\\u208E\\u2308-\\u230B\\u2329\\u232A\\u2768-\\u2775\\u27C5\\u27C6\\u27E6-\\u27EF\\u2983-\\u2998\\u29D8-\\u29DB\\u29FC\\u29FD\\u2CF9-\\u2CFC\\u2CFE\\u2CFF\\u2D70\\u2E00-\\u2E2E\\u2E30-\\u2E44\\u3000-\\u3003\\u3008-\\u3011\\u3014-\\u301F\\u3030\\u303D\\u30A0\\u30FB\\uA4FE\\uA4FF\\uA60D-\\uA60F\\uA673\\uA67E\\uA6F2-\\uA6F7\\uA874-\\uA877\\uA8CE\\uA8CF\\uA8F8-\\uA8FA\\uA8FC\\uA92E\\uA92F\\uA95F\\uA9C1-\\uA9CD\\uA9DE\\uA9DF\\uAA5C-\\uAA5F\\uAADE\\uAADF\\uAAF0\\uAAF1\\uABEB\\uFD3E\\uFD3F\\uFE10-\\uFE19\\uFE30-\\uFE52\\uFE54-\\uFE61\\uFE63\\uFE68\\uFE6A\\uFE6B\\uFF01-\\uFF03\\uFF05-\\uFF0A\\uFF0C-\\uFF0F\\uFF1A\\uFF1B\\uFF1F\\uFF20\\uFF3B-\\uFF3D\\uFF3F\\uFF5B\\uFF5D\\uFF5F-\\uFF65]|\\uD800[\\uDD00-\\uDD02\\uDF9F\\uDFD0]|\\uD801\\uDD6F|\\uD802[\\uDC57\\uDD1F\\uDD3F\\uDE50-\\uDE58\\uDE7F\\uDEF0-\\uDEF6\\uDF39-\\uDF3F\\uDF99-\\uDF9C]|\\uD804[\\uDC47-\\uDC4D\\uDCBB\\uDCBC\\uDCBE-\\uDCC1\\uDD40-\\uDD43\\uDD74\\uDD75\\uDDC5-\\uDDC9\\uDDCD\\uDDDB\\uDDDD-\\uDDDF\\uDE38-\\uDE3D\\uDEA9]|\\uD805[\\uDC4B-\\uDC4F\\uDC5B\\uDC5D\\uDCC6\\uDDC1-\\uDDD7\\uDE41-\\uDE43\\uDE60-\\uDE6C\\uDF3C-\\uDF3E]|\\uD807[\\uDC41-\\uDC45\\uDC70\\uDC71]|\\uD809[\\uDC70-\\uDC74]|\\uD81A[\\uDE6E\\uDE6F\\uDEF5\\uDF37-\\uDF3B\\uDF44]|\\uD82F\\uDC9F|\\uD836[\\uDE87-\\uDE8B]|\\uD83A[\\uDD5E\\uDD5F]/u,Y=/[^\\t-\\r -#%-\\*,-\\/:;\\?@\\[-\\]_\\{\\}\\x85\\xA0\\xA1\\xA7\\xAB\\xB6\\xB7\\xBB\\xBF\\u037E\\u0387\\u055A-\\u055F\\u0589\\u058A\\u05BE\\u05C0\\u05C3\\u05C6\\u05F3\\u05F4\\u0609\\u060A\\u060C\\u060D\\u061B\\u061E\\u061F\\u066A-\\u066D\\u06D4\\u0700-\\u070D\\u07F7-\\u07F9\\u0830-\\u083E\\u085E\\u0964\\u0965\\u0970\\u0AF0\\u0DF4\\u0E4F\\u0E5A\\u0E5B\\u0F04-\\u0F12\\u0F14\\u0F3A-\\u0F3D\\u0F85\\u0FD0-\\u0FD4\\u0FD9\\u0FDA\\u104A-\\u104F\\u10FB\\u1360-\\u1368\\u1400\\u166D\\u166E\\u1680\\u169B\\u169C\\u16EB-\\u16ED\\u1735\\u1736\\u17D4-\\u17D6\\u17D8-\\u17DA\\u1800-\\u180A\\u1944\\u1945\\u1A1E\\u1A1F\\u1AA0-\\u1AA6\\u1AA8-\\u1AAD\\u1B5A-\\u1B60\\u1BFC-\\u1BFF\\u1C3B-\\u1C3F\\u1C7E\\u1C7F\\u1CC0-\\u1CC7\\u1CD3\\u2000-\\u200A\\u2010-\\u2029\\u202F-\\u2043\\u2045-\\u2051\\u2053-\\u205F\\u207D\\u207E\\u208D\\u208E\\u2308-\\u230B\\u2329\\u232A\\u2768-\\u2775\\u27C5\\u27C6\\u27E6-\\u27EF\\u2983-\\u2998\\u29D8-\\u29DB\\u29FC\\u29FD\\u2CF9-\\u2CFC\\u2CFE\\u2CFF\\u2D70\\u2E00-\\u2E2E\\u2E30-\\u2E44\\u3000-\\u3003\\u3008-\\u3011\\u3014-\\u301F\\u3030\\u303D\\u30A0\\u30FB\\uA4FE\\uA4FF\\uA60D-\\uA60F\\uA673\\uA67E\\uA6F2-\\uA6F7\\uA874-\\uA877\\uA8CE\\uA8CF\\uA8F8-\\uA8FA\\uA8FC\\uA92E\\uA92F\\uA95F\\uA9C1-\\uA9CD\\uA9DE\\uA9DF\\uAA5C-\\uAA5F\\uAADE\\uAADF\\uAAF0\\uAAF1\\uABEB\\uFD3E\\uFD3F\\uFE10-\\uFE19\\uFE30-\\uFE52\\uFE54-\\uFE61\\uFE63\\uFE68\\uFE6A\\uFE6B\\uFF01-\\uFF03\\uFF05-\\uFF0A\\uFF0C-\\uFF0F\\uFF1A\\uFF1B\\uFF1F\\uFF20\\uFF3B-\\uFF3D\\uFF3F\\uFF5B\\uFF5D\\uFF5F-\\uFF65]|\\uD800[\\uDD00-\\uDD02\\uDF9F\\uDFD0]|\\uD801\\uDD6F|\\uD802[\\uDC57\\uDD1F\\uDD3F\\uDE50-\\uDE58\\uDE7F\\uDEF0-\\uDEF6\\uDF39-\\uDF3F\\uDF99-\\uDF9C]|\\uD804[\\uDC47-\\uDC4D\\uDCBB\\uDCBC\\uDCBE-\\uDCC1\\uDD40-\\uDD43\\uDD74\\uDD75\\uDDC5-\\uDDC9\\uDDCD\\uDDDB\\uDDDD-\\uDDDF\\uDE38-\\uDE3D\\uDEA9]|\\uD805[\\uDC4B-\\uDC4F\\uDC5B\\uDC5D\\uDCC6\\uDDC1-\\uDDD7\\uDE41-\\uDE43\\uDE60-\\uDE6C\\uDF3C-\\uDF3E]|\\uD807[\\uDC41-\\uDC45\\uDC70\\uDC71]|\\uD809[\\uDC70-\\uDC74]|\\uD81A[\\uDE6E\\uDE6F\\uDEF5\\uDF37-\\uDF3B\\uDF44]|\\uD82F\\uDC9F|\\uD836[\\uDE87-\\uDE8B]|\\uD83A[\\uDD5E\\uDD5F]/u,G=e=>{let u=[],t=document.createRange();for(t.selectNodeContents(document.body);!t.collapsed&&u.length<2;){let n;if(e.prefix){let r=g(e.prefix,t);if(r==null)break;p(t,r.startContainer,r.startOffset);let s=document.createRange();if(s.setStart(r.endContainer,r.endOffset),s.setEnd(t.endContainer,t.endOffset),b(s),s.collapsed||(n=g(e.textStart,s),n==null))break;if(n.compareBoundaryPoints(Range.START_TO_START,s)!==0)continue}else{if(n=g(e.textStart,t),n==null)break;p(t,n.startContainer,n.startOffset)}if(e.textEnd){let r=document.createRange();for(r.setStart(n.endContainer,n.endOffset),r.setEnd(t.endContainer,t.endOffset);!r.collapsed&&u.length<2;){let s=g(e.textEnd,r);if(s==null)break;if(p(r,s.startContainer,s.startOffset),n.setEnd(s.endContainer,s.endOffset),e.suffix){let i=w(e.suffix,n,t);if(i===D.NO_SUFFIX_MATCH)break;if(i===D.SUFFIX_MATCH){u.push(n.cloneRange());continue}else if(i===D.MISPLACED_SUFFIX)continue}else u.push(n.cloneRange())}}else if(e.suffix){let r=w(e.suffix,n,t);if(r===D.NO_SUFFIX_MATCH)break;if(r===D.SUFFIX_MATCH){u.push(n.cloneRange()),p(t,t.startContainer,t.startOffset);continue}else if(r===D.MISPLACED_SUFFIX)continue}else u.push(n.cloneRange())}return u},D={NO_SUFFIX_MATCH:0,SUFFIX_MATCH:1,MISPLACED_SUFFIX:2},w=(e,u,t)=>{let n=document.createRange();n.setStart(u.endContainer,u.endOffset),n.setEnd(t.endContainer,t.endOffset),b(n);let r=g(e,n);return r==null?D.NO_SUFFIX_MATCH:r.compareBoundaryPoints(Range.START_TO_START,n)!==0?D.MISPLACED_SUFFIX:D.SUFFIX_MATCH},p=(e,u,t)=>{try{e.setStart(u,t+1)}catch(n){e.setStartAfter(u)}},b=e=>{let u=document.createTreeWalker(e.commonAncestorContainer,NodeFilter.SHOW_TEXT,n=>N(n,e)),t=u.nextNode();for(;!e.collapsed&&t!=null;){if(t!==e.startContainer&&e.setStart(t,0),t.textContent.length>e.startOffset&&!t.textContent[e.startOffset].match(/\\s/))return;try{e.setStart(t,e.startOffset+1)}catch(n){t=u.nextNode(),t==null?e.collapse():e.setStart(t,0)}}},N=(e,u)=>{if(u!=null&&!u.intersectsNode(e))return NodeFilter.FILTER_REJECT;let t=e;for(;t!=null&&!(t instanceof HTMLElement);)t=t.parentNode;if(t!=null){let n=window.getComputedStyle(t);if(n.visibility==="hidden"||n.display==="none"||n.height===0||n.width===0||n.opacity===0)return NodeFilter.FILTER_REJECT}return NodeFilter.FILTER_ACCEPT},$=(e,u)=>{let t=[],n=[],r=Array.from(V(e,s=>N(s,u)));for(let s of r)s.nodeType===Node.TEXT_NODE?n.push(s):s instanceof HTMLElement&&_.includes(s.tagName)&&n.length>0&&(t.push(n),n=[]);return n.length>0&&t.push(n),t},z=(e,u,t)=>{let n="";return e.length===1?n=e[0].textContent.substring(u,t):n=e[0].textContent.substring(u)+e.slice(1,-1).reduce((r,s)=>r+s.textContent,"")+e.slice(-1)[0].textContent.substring(0,t),n.replace(/[\\t\\n\\r ]+/g," ")};function*V(e,u){let t=document.createTreeWalker(e,NodeFilter.SHOW_ELEMENT|NodeFilter.SHOW_TEXT,{acceptNode:u}),n;for(;n=t.nextNode();)yield n}var g=(e,u)=>{let t=$(u.commonAncestorContainer,u);for(let n of t){let r=K(e,u,n);if(r!==void 0)return r}},K=(e,u,t)=>{if(!e||!u||!(t||[]).length)return;let n=h(z(t,0,void 0)),r=h(e),s=t[0]===u.startNode?u.startOffset:0,i,a;for(;s<n.length;){let d=n.indexOf(r,s);if(d===-1)return;if(q(n,d,r.length)&&(i=I(d,t,!1),a=I(d+r.length,t,!0)),i!=null&&a!=null){let o=document.createRange();if(o.setStart(i.node,i.offset),o.setEnd(a.node,a.offset),u.compareBoundaryPoints(Range.START_TO_START,o)<=0&&u.compareBoundaryPoints(Range.END_TO_END,o)>=0)return o}s=d+1}},I=(e,u,t)=>{let n=0,r;for(let s=0;s<u.length;s++){let i=u[s];r||(r=h(i.data));let a=n+r.length;if(t&&(a+=1),a>e){let d=e-n,o=Math.min(e-n,i.data.length),f=t?r.substring(0,d):r.substring(d),c=h(t?i.data.substring(0,o):i.data.substring(o)),A=(t?-1:1)*(f.length>c.length?-1:1);for(;o>=0&&o<=i.data.length;){if(c.length===f.length)return{node:i,offset:o};o+=A,c=h(t?i.data.substring(0,o):i.data.substring(o))}}if(n+=r.length,s+1<u.length){let d=h(u[s+1].data);r.slice(-1)===" "&&d.slice(0,1)===" "&&(n-=1),r=d}}},q=(e,u,t)=>!(u<0||u>=e.length||t<=0||u+t>e.length||e[u].match(C)&&(++u,--t,!t)||e[u+t-1].match(C)&&(--t,!t)||u!==0&&!e[u-1].match(C)||u+t!==e.length&&!e[u+t].match(C)),h=e=>(e||"").normalize("NFKD").replace(/\\s+/g," ").replace(/[\\u0300-\\u036f]/g,"").toLowerCase(),l={BLOCK_ELEMENTS:_,BOUNDARY_CHARS:C,NON_BOUNDARY_CHARS:Y,filterFunction:N,normalizeString:h};typeof goog!="undefined"&&goog.declareModuleId("googleChromeLabs.textFragmentPolyfill.textFragmentUtils");var J=300,Q=3;var j=500,M;var E={SUCCESS:0,INVALID_SELECTION:1,AMBIGUOUS:2,TIMEOUT:3},L=(e,u=Date.now())=>{try{return Z(e,u)}catch(t){return{status:E.TIMEOUT}}};var Z=(e,u)=>{ee(u);let t;try{t=e.getRangeAt(0)}catch{return{status:E.INVALID_SELECTION}}if(se(t),ie(t),t.collapsed)return{status:E.INVALID_SELECTION};let n,r=l.normalizeString(t.toString());if(te(t)){let f={textStart:r};if(U(f))return{status:E.SUCCESS,fragment:f};n=new x().setExactTextMatch(r)}else{let f=y(t),c=H(t);f&&c?n=new x().setStartAndEndSearchSpace(f,c):n=new x().setSharedSearchSpace(t.toString().trim())}let i=document.createRange();i.selectNodeContents(document.body);let a=i.cloneRange();i.setEnd(t.startContainer,t.startOffset),a.setStart(t.endContainer,t.endOffset);let d=H(i),o=y(a);for((d||o)&&n.setPrefixAndSuffixSearchSpace(d,o);n.embiggen();){let f=n.tryToMakeUniqueFragment();if(f!=null)return{status:E.SUCCESS,fragment:f};S()}return{status:E.AMBIGUOUS}},S=()=>{let e=Date.now()-M;if(e>j){let u=new Error(`Fragment generation timed out after ${e} ms.`);throw u.isTimeout=!0,u}},ee=e=>{M=e},y=e=>{let u=k(e),t=O(u,e.endContainer);if(!t)return;let n=m(t),r=u,s=e.cloneRange();for(;!s.collapsed&&u!=null;){if(S(),u.contains(r)?s.setStartAfter(u):s.setStartBefore(u),F(u)){let i=e.cloneRange();i.setEnd(s.startContainer,s.startOffset);let a=i.toString().trim();if(a.length>0)return a}u=B(t,n)}},H=e=>{let u=ue(e),t=O(u,e.startContainer);if(!t)return;let n=new Set,r=u,s=e.cloneRange();for(;!s.collapsed&&u!=null;){if(S(),u.contains(r)?s.setEnd(u,0):s.setEndAfter(u),F(u)){let i=e.cloneRange();i.setStart(s.endContainer,s.endOffset);let a=i.toString().trim();if(a.length>0)return a}u=R(t,n,r)}},x=class{constructor(){this.Mode={ALL_PARTS:1,SHARED_START_AND_END:2,CONTEXT_ONLY:3},this.startOffset=null,this.endOffset=null,this.prefixOffset=null,this.suffixOffset=null,this.prefixSearchSpace="",this.backwardsPrefixSearchSpace="",this.suffixSearchSpace="",this.numIterations=0}tryToMakeUniqueFragment(){let e;if(this.mode===this.Mode.CONTEXT_ONLY?e={textStart:this.exactTextMatch}:e={textStart:this.getStartSearchSpace().substring(0,this.startOffset).trim(),textEnd:this.getEndSearchSpace().substring(this.endOffset).trim()},this.prefixOffset!=null){let u=this.getPrefixSearchSpace().substring(this.prefixOffset).trim();u&&(e.prefix=u)}if(this.suffixOffset!=null){let u=this.getSuffixSearchSpace().substring(0,this.suffixOffset).trim();u&&(e.suffix=u)}return U(e)?e:void 0}embiggen(){let e=!0;this.mode===this.Mode.SHARED_START_AND_END?this.startOffset>=this.endOffset&&(e=!1):this.mode===this.Mode.ALL_PARTS?this.startOffset===this.getStartSearchSpace().length&&this.backwardsEndOffset()===this.getEndSearchSpace().length&&(e=!1):this.mode===this.Mode.CONTEXT_ONLY&&(e=!1);let u=!1;if((!e||this.numIterations>=Q)&&(this.backwardsPrefixOffset()!=null&&this.backwardsPrefixOffset()!==this.getPrefixSearchSpace().length||this.suffixOffset!=null&&this.suffixOffset!==this.getSuffixSearchSpace().length)&&(u=!0),e){if(this.startOffset<this.getStartSearchSpace().length){let t=this.getStartSearchSpace().substring(this.startOffset+1).search(l.BOUNDARY_CHARS);t===-1?this.startOffset=this.getStartSearchSpace().length:this.startOffset=this.startOffset+1+t,this.mode===this.Mode.SHARED_START_AND_END&&(this.startOffset=Math.min(this.startOffset,this.endOffset))}if(this.backwardsEndOffset()<this.getEndSearchSpace().length){let t=this.getBackwardsEndSearchSpace().substring(this.backwardsEndOffset()+1).search(l.BOUNDARY_CHARS);t===-1?this.setBackwardsEndOffset(this.getEndSearchSpace().length):this.setBackwardsEndOffset(this.backwardsEndOffset()+1+t),this.mode===this.Mode.SHARED_START_AND_END&&(this.endOffset=Math.max(this.startOffset,this.endOffset))}}if(u){if(this.backwardsPrefixOffset()<this.getPrefixSearchSpace().length){let t=this.getBackwardsPrefixSearchSpace().substring(this.backwardsPrefixOffset()+1).search(l.BOUNDARY_CHARS);t===-1?this.setBackwardsPrefixOffset(this.getBackwardsPrefixSearchSpace().length):this.setBackwardsPrefixOffset(this.backwardsPrefixOffset()+1+t)}if(this.suffixOffset<this.getSuffixSearchSpace().length){let t=this.getSuffixSearchSpace().substring(this.suffixOffset+1).search(l.BOUNDARY_CHARS);t===-1?this.suffixOffset=this.getSuffixSearchSpace().length:this.suffixOffset=this.suffixOffset+1+t}}return this.numIterations++,e||u}setStartAndEndSearchSpace(e,u){return this.startSearchSpace=e,this.endSearchSpace=u,this.backwardsEndSearchSpace=T(u),this.startOffset=0,this.endOffset=u.length,this.mode=this.Mode.ALL_PARTS,this}setSharedSearchSpace(e){return this.sharedSearchSpace=e,this.backwardsSharedSearchSpace=T(e),this.startOffset=0,this.endOffset=e.length,this.mode=this.Mode.SHARED_START_AND_END,this}setExactTextMatch(e){return this.exactTextMatch=e,this.mode=this.Mode.CONTEXT_ONLY,this}setPrefixAndSuffixSearchSpace(e,u){return e&&(this.prefixSearchSpace=e,this.backwardsPrefixSearchSpace=T(e),this.prefixOffset=e.length),u&&(this.suffixSearchSpace=u,this.suffixOffset=0),this}getStartSearchSpace(){return this.mode===this.Mode.SHARED_START_AND_END?this.sharedSearchSpace:this.startSearchSpace}getEndSearchSpace(){return this.mode===this.Mode.SHARED_START_AND_END?this.sharedSearchSpace:this.endSearchSpace}getBackwardsEndSearchSpace(){return this.mode===this.Mode.SHARED_START_AND_END?this.backwardsSharedSearchSpace:this.backwardsEndSearchSpace}getPrefixSearchSpace(){return this.prefixSearchSpace}getBackwardsPrefixSearchSpace(){return this.backwardsPrefixSearchSpace}getSuffixSearchSpace(){return this.suffixSearchSpace}backwardsEndOffset(){return this.getEndSearchSpace().length-this.endOffset}setBackwardsEndOffset(e){this.endOffset=this.getEndSearchSpace().length-e}backwardsPrefixOffset(){return this.prefixOffset==null?null:this.getPrefixSearchSpace().length-this.prefixOffset}setBackwardsPrefixOffset(e){this.prefixOffset!=null&&(this.prefixOffset=this.getPrefixSearchSpace().length-e)}},U=e=>G(e).length===1,T=e=>[...e||""].reverse().join(""),te=e=>e.toString().length>J?!1:!ne(e),k=e=>{let u=e.startContainer;return u.nodeType==Node.ELEMENT_NODE&&e.startOffset<u.childNodes.length&&(u=u.childNodes[e.startOffset]),u},ue=e=>{let u=e.endContainer;return u.nodeType==Node.ELEMENT_NODE&&e.endOffset>0&&(u=u.childNodes[e.endOffset-1]),u},ne=e=>{let u=e.cloneRange(),t=k(u),n=O(t);if(!n)return!1;let r=m(n);for(;!u.collapsed&&t!=null;){if(F(t))return!0;t!=null&&u.setStartAfter(t),t=B(n,r),S()}return!1},P=(e,u)=>{if(e.nodeType!==Node.TEXT_NODE)return-1;let t=u??e.data.length;if(t<e.data.length&&l.BOUNDARY_CHARS.test(e.data[t]))return t;let n=e.data.substring(0,t),r=T(n).search(l.BOUNDARY_CHARS);return r!==-1?t-r:-1},re=(e,u)=>{if(e.nodeType!==Node.TEXT_NODE)return-1;let t=u??0;if(t<e.data.length&&t>0&&l.BOUNDARY_CHARS.test(e.data[t-1]))return t;let r=e.data.substring(t).search(l.BOUNDARY_CHARS);return r!==-1?t+r:-1},O=(e,u)=>{if(!e)return;let t=e,n=u??e;for(;!t.contains(n)||!F(t);)t.parentNode&&(t=t.parentNode);let r=document.createTreeWalker(t,NodeFilter.SHOW_ELEMENT|NodeFilter.SHOW_TEXT,s=>l.filterFunction(s));return r.currentNode=e,r},se=e=>{let u=P(e.startContainer,e.startOffset);if(u!==-1){e.setStart(e.startContainer,u);return}if(F(e.startContainer)&&e.startOffset===0)return;let t=O(e.startContainer);if(!t)return;let n=new Set,r=t.currentNode,s=R(t,n,r);for(;s!=null;){let i=P(s);if(i!==-1){e.setStart(s,i);return}if(F(s)){s.contains(e.startContainer)?e.setStart(s,0):e.setStartAfter(s);return}s=R(t,n,r)}e.collapse()},m=e=>{let u=e.currentNode,t=new Set,n=new Map;do{let r=e.currentNode;for(t.add(r);e.lastChild()!=null&&!t.has(e.currentNode););let s=n.get(e.currentNode);e.currentNode!==r&&n.set(e.currentNode,r),n.set(r,s||e.nextNode()),e.currentNode=r}while(e.parentNode()!=null);return e.currentNode=u,n},B=(e,u)=>{if(u.has(e.currentNode)){let t=u.get(e.currentNode);return t!=null&&(e.currentNode=t),t}return e.nextNode()},R=(e,u,t)=>{for(;;){if(S(),!u.has(e.currentNode)&&!e.currentNode.contains(t)&&(u.add(e.currentNode),e.lastChild()!=null)||e.previousSibling()!=null)return e.currentNode;if(e.parentNode()==null)return null;if(!u.has(e.currentNode))return e.currentNode}},ie=e=>{let u=e.endOffset,t=e.endContainer;t.nodeType===Node.ELEMENT_NODE&&e.endOffset<t.childNodes.length&&(t=t.childNodes[e.endOffset]);let n=O(t);if(!n)return;let r=m(n);for(;t!=null;){S();let s=re(t,u);if(u=null,s!==-1){e.setEnd(t,s);return}if(F(t)){t.contains(e.endContainer)?e.setEnd(t,t.childNodes.length):e.setEndBefore(t);return}t=B(n,r)}e.collapse()},F=e=>e.nodeType===Node.ELEMENT_NODE&&(l.BLOCK_ELEMENTS.includes(e.tagName)||e.tagName==="HTML"||e.tagName==="BODY");typeof goog!="undefined"&&goog.declareModuleId("googleChromeLabs.textFragmentPolyfill.fragmentGenerationUtils");(e=>{console.log({browser:e}),console.log({chrome});let u=!0,t=(...a)=>{u&&console.log(...a)},n=a=>{let d=window.getSelection(),o=L(d),f=`${location.origin}${location.pathname}${location.search}`;if(o.status===0){let c=o.fragment,A=c.prefix?`${encodeURIComponent(c.prefix)}-,`:"",X=c.suffix?`,-${encodeURIComponent(c.suffix)}`:"",v=encodeURIComponent(c.textStart),W=c.textEnd?`,${encodeURIComponent(c.textEnd)}`:"";f=`${f}#:~:text=${A}${v}${W}${X}`,i(f,d.toString()),r()}else s()},r=()=>{let a=document.createElement("style");document.head.append(a),a.sheet.insertRule(" ::selection { color: #000 !important; background-color: #ffff00 !important; }");let o=window.getSelection(),f=o.getRangeAt(0);return o.removeAllRanges(),window.setTimeout(()=>o.addRange(f),0),window.setTimeout(()=>a.remove(),2e3),!0},s=()=>(window.queueMicrotask(()=>{}),!0),i=async(a,d)=>{let o="rich";try{let{state:f}=await navigator.permissions.query({name:"clipboard-write"});if(f!=="granted")throw new Error("Clipboard permission not granted");let c={"text/plain":new Blob([a],{type:"text/plain"})};o==="rich"&&(c["text/html"]=new Blob([`<a href="${a}">${d}</a>`],{type:"text/html"}));let A=[new ClipboardItem(c)];await navigator.clipboard.write(A)}catch(f){console.warn(f.name,f.message);let c=document.createElement("textarea");document.body.append(c),c.textContent=a,c.select(),document.execCommand("copy"),c.remove()}return t("\\u{1F389}",a),!0};n()})(chrome||browser);})();',
    });
  }
}, originalClipboard).then((retVal) => {
  console.log(retVal);
});

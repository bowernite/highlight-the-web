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
      console.log(`🟡 🟡 🟡 delaying...`)
      delay(0.05);
      console.log(`🟡 🟡 🟡 done delaying`)
      const textFragmentLink = chrome.theClipboard();
      console.log("link:", textFragmentLink);

      retVal = `${selectedText} ([source](${textFragmentLink}))`;
      console.log("retVal:", retVal);
    } else {
      // If just copying the URL, use the title as the MD link title
      const title = tabTitle();
      retVal = `[${title}](${url})`;
    }

    return retVal;
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

  ///////////////////////////////////////
  // Reference
  ///////////////////////////////////////

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

  ///////////////////////////////////////
  // Hairy
  ///////////////////////////////////////

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

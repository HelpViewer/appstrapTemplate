"use strict";
const treeTOCName = 'tree';
const contentPane = $('content');

var pagePath = '';
var dataPath = '';

FILENAME_DEFAULT_HELPFILE = `hlp/Help-__.zip`;

var PRJNAME_VAL = null;

const PAR_NAME_PAGE = 'p'; // chapter page path

const KEY_LS_PRINTICONS = "printIcons";

var dataPathGeneral;

var activeLanguage = getActiveLanguage();

const PLG_KEY_HASH = '_hash';

function LoadURLParameters() {
  var handler = (x) => x;
  dataPathGeneral = getGets(PAR_NAME_DOC, handler) || FILENAME_DEFAULT_HELPFILE;
  dataPath = dataPathGeneral?.replace('__', activeLanguage);
  pagePath = getGets(PAR_NAME_PAGE, handler) || FILENAME_1STTOPIC;
  idxTreeItem = parseInt(getGets(PAR_NAME_ID, handler)) || 0;
}

const evtHashDefined = 'HASHDEFINED';

LoadURLParameters();
const treeItemHandlerGet = () => idxTreeItem;

const tree = $('tree');

var languages = getLanguagesList();

loadLocalization(activeLanguage).then(() => {
  if (!dataPath)
    log(`Data file has not been specified. Use ?${PAR_NAME_DOC}= and its path in URI. Used default file name.`);
});

class pAppmainNext extends IPlugin {
  constructor(aliasName, data) {
    super(aliasName, data);
  }

  init() {
    const TI = this;

    //HASHDEFINED
    const h_EVT_HASHDEFINED = (d) => {
      scrollToAnchor(d.result);
    };
    TI.eventDefinitions.push([evtHashDefined, IEvent, h_EVT_HASHDEFINED]);

    super.init();

    TI.catalogizeEventCall(TI.onETBeforePrint, EventNames.HeaderGet);

    TI.SEVT_POPSTATE = new SystemEventHandler('', undefined, window, 'popstate', this._handlePopstate);
    TI.SEVT_POPSTATE.init();
  }

  deInit() {
    super.deInit();
  }

  _handlePopstate() {
  };

  async onETPluginsLoadingFinished(d) {
    if (!Plugins.pluginsClasses.has('puiButtonToggleSide')) {
      const container = $('container');
      if (container)
        container.classList.add('toright');
    }

    if (DEBUG_MODE) {
      log('W Application is in DEBUG_MODE, debug tools will be attached. Turn DEBUG_MODE to off in hvdata/appmain.js file for work in production.');
      const objExplorerName = '../base/plugins/puiButtonObjectExplorer';
      await loadPlugin(objExplorerName, loadPluginListBasePath(objExplorerName));
      await activatePlugin(objExplorerName, '-load');
      loadLocalization(getActiveLanguage());
    }
  }

  onETStorageAdded(d) {
    if (d.storageName != STO_HELP)
      return;
  
    notifyUserDataFileLoaded(d.fileName);
  }

  onETClickedEventTree(d) {
    if (d.treeId != 'tree' && d.treeId != 'bmark' && d.treeId != 'objectList') 
      return;
  
    idxTreeItem = d.elementIdVal;
    sendEvent(evtHideIfTooWide);
  }

  //evtHideIfTooWide
  onETHIDEIFTOOWIDE(d) {
    const sidebar = $('sidebar');
    if (sidebar.classList.contains(C_TOOWIDE) && !sidebar.classList.contains(C_HIDDENC))
      toggleSidebar();
  }

  onETUserDataFileLoaded(d) {
    configFileReload(FILE_CONFIG);
    showSidebarTab();
  }

  onETClickedEventNotForwarded(d) {
    if (!d.target)
      d.stop = true;
  
    const a = d.target.closest('a');
    if (!d.target.closest('a, input, summary, button'))
      d.stop = true;
  
    if (d.target.closest('label'))
      return;
  
    if (d.stop) {
      d.event.preventDefault();
      return;
    }
  
    if (a)
      processAClick(a, d);
  }

  onETNavigationMove(d) {
    loadPageByTreeId(d.newId, d.treeId);
  }

  onETChapterShown(d) {
    if (d.id) 
      return;
    
    revealTreeItem(`${N_P_TREEITEM}|${idxTreeItem}`);

    if (d.addressOrig.toLowerCase() != '~changelog.md') {
      if (d.sourceObject) {
        if (resolveFileMedium(d.sourceObject.getAttribute('href')) == UserDataFileLoadedFileType.NETWORK) {
          setToHrefByValues((x) => {
            x.kvlist.set(PAR_NAME_ID, idxTreeItem);
          });
        } else {
          setToHref(d.sourceObject.href);
        }
      } else {
        // setToHrefByValues((x) => {
        //   x.kvlist.set(PAR_NAME_PAGE, d.addressOrig);
        //   x.kvlist.set(PAR_NAME_ID, idxTreeItem);
        // });
      }
    }
  
    requestAnimationFrame(() => {
      const hash = location.hash;
  
      if (hash)
        sendEvent(evtHashDefined, (x) => x.result = hash.substring(1));
    });
  
    contentPane.focus();
    refreshTitlesForLangStrings();
  }

}

Plugins.catalogize(pAppmainNext);
const plgName = 'pAppmainNext';
const plgAlias = '';
activatePlugin(plgName, plgAlias).then(() => sendEvent(EVT_PluginsLoadingFinished, (x) => x.result = [ [plgName, plgAlias] ]));
pAppmainNext._fileLength = new TextEncoder().encode(pAppmainNext.toString()).length;

{
  const sidebar = $('sidebar');
  sidebar.classList.remove(C_NOTRANSITION);
  if (!sidebar.style.display) {
    sidebar.style.display = 'flex';
    sidebar.style.opacity = '1';
  }
}

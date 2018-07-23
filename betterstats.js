/* VERS 1.0 */

// VARS

const YOU_ALREADY_RUN_THIS_SCRIPT_ON_THIS_PAGE___IF_YOU_WANT_TO_RUN_IT_AGAIN_REFRESH_THE_PAGE = '<- error message in console if you re-execute this script';
let tabClosed;
let wind;
let idStore = [];


// UTILITIES

const sleep = (durationMs) => new Promise(resolve => setTimeout(() => {resolve()}, durationMs));

const now = () => new Date().toString().split(' ').slice(1,5).join(' ');

async function loading() {
  const spinner = wind.document.getElementById('loading-label');
  if (spinner) spinner.innerHTML = 'Loading ..';
  await sleep(3000);
  if (spinner) spinner.innerHTML = '';
}

const extractSteemitLink = (row) => {
  const anchors = row.getElementsByTagName('a');
  for (let idx = 0; idx < anchors.length; idx++) {
    const href = anchors[idx].href;
    if (href.indexOf('steemit.com') !== -1 && href.split('/').length > 4) return href;
  }
}

const cleanLocalStorage = () => {
  Object.keys(localStorage).forEach((key) => {
    if (key.substr(0,2) === '~~' && idStore.indexOf(key) === -1) localStorage.removeItem(key);
  });
}

const showLoadingIfNotLoadedYet = () => {
  setTimeout(() => {
    if (wind && !wind.document.getElementById('hint')) {
      console.log('Not loaded yet, refreshing stats..');
      const body = wind.document.getElementsByTagName('body')[0];
      body.className = '';
      body.style['padding'] = '50px';
      body.innerHTML = `<div>Almost done...</div>`;
      setTimeout(() => refreshStats(), 5000);
    }
  }, 5000)
}

const scrapeStats = () => {
  const results = [];
  const allRows = document.querySelectorAll(
    'tr[ng-repeat="content in watched_content | orderObjectBy:sortTypePosts:sortReversePosts"]'
  );
  idStore = [];
  for (let idx = 0; idx < allRows.length; idx++) {
    if(allRows[idx].innerHTML.indexOf('(author)') !== -1) {
      const rightLink = extractSteemitLink(allRows[idx]) || `~~err${idx}`;
      const id = `~~${btoa(rightLink)}`;
      idStore.push(id);
      results.push(`
        <div id="${id}"
          onclick="if(this.style['background-color']==='lightcyan'){this.style['background-color']='white';localStorage.removeItem(this.id)}else{this.style['background-color']='lightcyan';localStorage.setItem(this.id,1)}"
          style="padding:10px;border:thin solid grey;margin-top:-10px;${
          localStorage.getItem(id) ? 'background-color:lightcyan' : ''
        }">
          ${allRows[idx].innerHTML}
          <small id="hint" style="float:right;margin-right:5px;font-size:10px;color:grey">click background to highlight</small>
        </div>`
      );
    }
  }
  return results;
}

const tabIsOpen = () => {
  if (tabClosed || !wind) {
    tabClosed = false;
    console.log('Tab was closed. Reopening..');
    openTab();
    return false;
  }
  return true;
}

const injectBody = (items) => {
  const body = wind.document.getElementsByTagName('body')[0];
  body.className = '';
  body.style['padding'] = '10px 50px';
  body.innerHTML = `
    <h2 style="color:#2185d0;text-align:center;color:#21ba45;padding:15px;font-family:Lato,'Helvetica Neue',Arial,Helvetica,sans-serif;font-weight:700;line-height:1.2857em;">
      All your recent posts
    </h2>
    <div style="float:left;width:140px;height:40px;margin-top:-60px;">
      <img
        onclick="window.opener.document.getElementById('refresh-now').click();"
        style="cursor:pointer;height:30px"
        src="https://cdn4.iconfinder.com/data/icons/juicyfruit_by_salleedesign/256x256/refresh.png"
      />
      <span style="float:right;margin-top:10px;color:#3bc74b" id="loading-label"></span>
    </div>
    <small style="float:right;color:red;margin:-40px 10px"><b>DO NOT REFRESH THIS PAGE</b></small>
    <div id="new-container">${items.length ? items.join('<br>') : 'Loading...'}</div>`;
  // wind.window.onbeforeunload = kittens; // nah, let me close it - it will be re-opened with refreshStats.
}

const changeStylesGivenSelector = (selector, styleArr = []) => {
  const elemArr = wind.document.querySelectorAll(selector);
  styleArr.forEach(({ key, value }) => {
    elemArr.forEach((e) => e.style[key] = value);
  });
}

const removeElementGivenSelector = (selector) => {
  const elemArr = wind.document.querySelectorAll(selector);
  elemArr.forEach((e) => e.parentNode.removeChild(e));
}

const makeAccountNameBigger = (selector) => {
  const elemArr = wind.document.querySelectorAll(selector);
  elemArr.forEach((e) => e.innerHTML = `<b style="font-size:18px;position:absolute;left:160px">
    <a href="https://steemit.com/@${e.innerText.split(' ')[1]}" target="_blank">${
      e.innerText.split(' ')[1].toUpperCase()
    }</a>
  </b>`);
}

const addManualRefreshBtn = () => {
  const refreshBtn = document.getElementById('refresh-now');
  if (!refreshBtn) {
    const elem = document.createElement('div');
    elem.style.cursor = 'pointer';
    elem.innerHTML = `<img
      id="refresh-now"
      onclick="refreshStats()"
      style="height:30px"
      src="https://cdn4.iconfinder.com/data/icons/juicyfruit_by_salleedesign/256x256/refresh.png"
    />`;
    const tabs = document.querySelectorAll('div[class="ui top attached tabular menu ng-scope"]')[0];
    tabs && tabs.appendChild(elem);
  }
}

const tweakStyling = () => {
  changeStylesGivenSelector('div[class="ui small header ng-scope"]', [
    { key: 'display', value: 'inherit' },
    { key: 'margin-left', value: '650px' },
    { key: 'margin-top', value: '-80px' }
  ]);
  changeStylesGivenSelector('div[class="ui list"]', [{ key: 'margin-bottom', value: '-40px'}]);
  changeStylesGivenSelector('div[class="ui small header"]', [{ key: 'margin-left', value: '60px'}]);
  changeStylesGivenSelector('small[class="ng-binding"]', [
    { key: 'position', value: 'absolute' },
    { key: 'left', value: '360px' },
  ]);
  changeStylesGivenSelector('span[class="ui small green label ng-binding ng-scope"]', [{
    key: 'color', value: '#079207'
  }]);

  removeElementGivenSelector('button[class="circular ui basic icon button"]');
  removeElementGivenSelector('table[class="ui compact small table ng-scope"]');
  removeElementGivenSelector('div[class="ui small header ng-scope"]');

  makeAccountNameBigger('a[class="ui small basic label ng-binding purple"]');
  makeAccountNameBigger('a[class="ui small basic label ng-binding blue"]');

  addManualRefreshBtn();
}


// LOGIC FLOW

async function refreshStats() {
  console.log(`${now()} -- Going to refresh stats..`)
  await loading();

  console.log(`${now()} -- Extracting stats from steemstats.com ..`);
  var items = scrapeStats();

  console.log(`${now()} -- Checking if the other tab is still open..`);
  if(!tabIsOpen()) return;

  console.log(`${now()} -- Injecting new body in steemstats opened in new tab ..`);
  injectBody(items);

  console.log(`${now()} -- Tweaking some styling in steemstats opened in new tab ..`);
  tweakStyling();

  console.log(`${now()} -- Performing some cleansing on the localStorage..`);
  cleanLocalStorage();

  console.log(`${now()} -- Done.`);
  showLoadingIfNotLoadedYet()
}


// STARTUP

const openTab = () => {
  wind = open('');
  wind.document.title = 'My Steemit Posts';
  setTimeout(() => { refreshStats() }, 2000);
  wind.onbeforeunload = () => { tabClosed = true; return undefined; }
}
openTab();
setInterval(() => refreshStats(), 5 * 60000); // every 5 MINs
let githubW;
const kittens = () => {
  try {
    console.error(`Closing the other tab.
      If you remain on this page the other tab will be reopened, if you leave you'll have to re-run the script.
      Opening the github page for you.`
    );
    wind.close && wind.close();
    if (!githubW || githubW.window.closed)
      githubW = open('https://github.com/mycatnamedweb/steemstats-improvement_script/blob/master/betterstats.js');
  } catch (e) { console.error(`Unable to close the other tab. Cause: ${e}`); }
  return "Dude, are you sure you want to leave? Think of the kittens!";
}
window.onbeforeunload = kittens;

// https://github.com/mycatnamedweb/steemstats-improvement_script/blob/master/betterstats.js

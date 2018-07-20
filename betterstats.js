/* VERS 1.0 */
const YOU_ALREADY_RUN_THIS_SCRIPT_ON_THIS_PAGE___IF_YOU_WANT_TO_RUN_IT_AGAIN_REFRESH_THE_PAGE = '<- error message in console if you re-execute this script';

// VARS

let tabClosed;
let wind;
let idStore = [];


// UTILITIES

const sleep = (durationMs) => new Promise(resolve => setTimeout(() => {resolve()}, durationMs));

const now = () => new Date().toString().split(' ').slice(1,5).join(' ');

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
      const body = wind.document.getElementsByTagName('body')[0];
      body.className = '';
      body.style['padding'] = '50px';
      body.innerHTML = `<div id="loading">Loading...</div>`;
      setTimeout(() => refreshStats(), 5000);
    }
  }, 5000)
}

const scrapeStats = () => {
  const results = [];
  const allRows = document.querySelectorAll(
    'tr[ng-repeat="content in watched_content | orderObjectBy:sortTypePosts:sortReversePosts"]'
  );
  for (let idx = 0; idx < allRows.length; idx++) {
    if(allRows[idx].innerHTML.indexOf('(author)') !== -1) {
      const rightLink = extractSteemitLink(allRows[idx]) || `~~err${idx}`;
      const id = `~~${btoa(rightLink)}`;
      idStore.push(id);
      results.push(`
        <div id="${id}"
          onclick="if(this.style['background-color']==='lightcyan'){this.style['background-color']='white';localStorage.removeItem(this.id)}else{this.style['background-color']='lightcyan';localStorage.setItem(this.id,1)}"
          style="padding:5px;border:thin solid grey;margin-top:-10px;${
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
  if (tabClosed) {
    tabClosed = false;
    console.log('Tab was closed. Reopening..');
    openTab();
    return false;
  }
  return true;
}

const injectBody = (results) => {
  const body = wind.document.getElementsByTagName('body')[0];
  body.className = '';
  body.style['padding'] = '10px 50px';
  body.innerHTML = `
    <h2 style="text-align:center;color:#21ba45;padding:15px">All your recent posts</h2>
    <small style="float:right;color:red;margin:-40px 10px"><b>DO NOT REFRESH</b></small>
    <div id="new-container">${results.join('<br>')}</div>`;
  // wind.window.onbeforeunload = kittens; // nah, let me close it - it will re-open it on refresh.
}

const changeStylesGivenSelector = (selector, styleArr) => {
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
  elemArr.forEach((e) => e.innerHTML = `<b style="font-size:18px">
    ${e.innerText.split(' ')[1].toUpperCase()}
  </b>`);
}

const tweakStyling = () => {
  const styles = [{
    key: 'display',
    value: 'inherit'
  },{
    key: 'margin-left',
    value: '650px'
  },{
    key: 'margin-top',
    value: '-80px'
  }];
  changeStylesGivenSelector('div[class="ui small header ng-scope"]', styles);
  changeStylesGivenSelector('div[class="ui list"]', [{ key: 'margin-bottom', value: '-60px'}]);
  changeStylesGivenSelector('div[class="ui small header"]', [{ key: 'margin-left', value: '60px'}]);

  removeElementGivenSelector('button[class="circular ui basic icon button"]');
  removeElementGivenSelector('table[class="ui compact small table ng-scope"]');
  removeElementGivenSelector('div[class="ui small header ng-scope"]');

  makeAccountNameBigger('a[class="ui small basic label ng-binding purple"]');
  makeAccountNameBigger('a[class="ui small basic label ng-binding blue"]');
}


// LOGIC FLOW

async function refreshStats() {
  console.log(`${now()} -- Going to refresh stats..`)
  await sleep(5000);

  console.log(`${now()} -- Extracting stats from steemstats.com ..`);
  var results = scrapeStats();

  console.log(`${now()} -- Checking if the other tab is still open..`);
  if(!tabIsOpen()) return;

  console.log(`${now()} -- Injecting new body in steemstats opened in new tab ..`);
  injectBody(results);

  console.log(`${now()} -- Tweaking some styling in steemstats opened in new tab ..`);
  tweakStyling();

  console.log(`${now()} -- Performing some cleansing on the localStorage..`);
  cleanLocalStorage();

  console.log(`${now()} -- Done.`);
  showLoadingIfNotLoadedYet()
}


// STARTUP

const openTab = () => {
  wind = open('https://steemstats.com/#!/');
  wind.addEventListener('load', refreshStats());
  wind.onbeforeunload = () => { tabClosed = true; return undefined; }
}
openTab();
setInterval(() => refreshStats(), 5 * 60000); // every 5 MINs
const kittens = () => {
  try {
    console.error('Closing the other tab. If you go on and close this tab you`ll have to re-run the script.');
    wind.close && wind.close();
  } catch (e) { console.error(`Unable to close the other tab. Cause: ${e}`); }
  return "Dude, are you sure you want to leave? Think of the kittens!";
}
window.onbeforeunload = kittens;

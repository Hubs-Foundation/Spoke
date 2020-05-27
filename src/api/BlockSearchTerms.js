const BLOCK_SEARCH_TERMS = ["sex", "drugs"];

const SearchTermBlackList = {};
for (let i = 0; i < BLOCK_SEARCH_TERMS.length; i++) {
  SearchTermBlackList[BLOCK_SEARCH_TERMS[i]] = 0;
}

export const searchTermsExistInBlacklist = value => {
  const wordsArray = value.split(" ");
  let existsInBlacklist = false;
  for (let i = 0; i < wordsArray.length; i++) {
    if (wordsArray[i].trim() in SearchTermBlackList) existsInBlacklist = true;
  }
  return existsInBlacklist;
};

export default searchTermsExistInBlacklist;

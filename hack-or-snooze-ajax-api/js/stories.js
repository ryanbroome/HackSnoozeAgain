'use strict';

// This is the global list of the stories, an instance of StoryList
let storyList;

/** Get and show stories when site first loads. */

async function getAndShowStoriesOnStart() {
  storyList = await StoryList.getStories();
  $storiesLoadingMsg.remove();

  putStoriesOnPage();
  // putFavoritesOnPage();
}

/**
 * A render method to render HTML for an individual Story instance
 * - story: an instance of Story
 *
 * Returns the markup for the story.
 */

function generateStoryMarkup(tempStory) {
  console.debug('generateStoryMarkup');
  const hostName = tempStory.getHostName(tempStory.url);
  if (currentUser) {
    return $(`
      <li id="${tempStory.storyId}">
        <img data-id="${tempStory.storyId}" data-checked="false" src="unchecked.png" height="10vh" width="10vw">
        <a href="${tempStory.url}" target="a_blank" class="story-link">
          ${tempStory.title}
        </a>
        <span class="remove">remove favorite</span>
        <span class="delete">Delete</span>
        <small class="story-hostname">(${hostName})</small>
        <small class="story-author">by ${tempStory.author}</small>
        <small class="story-user">posted by ${tempStory.username}</small>
      </li>
    `);
  }
}
//  a render method to render HTML for an individual Story instance for a favorite story, I'd like to mimick the solution and put a switch in here to change the .src img for when creating markup for a favorite story but haven't been able to get it to work
function generateFavoriteStoryMarkup(tempStory) {
  console.debug('generateFavoriteStoryMarkup');
  const hostName = tempStory.getHostName(tempStory.url);
  if (currentUser && currentUser.isFavorite(tempStory.storyId)) {
    return $(`
      <li id="${tempStory.storyId}">
        <img data-id="${tempStory.storyId}" data-checked="true" src="checked.png" height="10vh" width="10vw">
        <a href="${tempStory.url}" target="a_blank" class="story-link">
          ${tempStory.title}
        </a>
        <span class="remove">remove favorite</span>
        <span class="delete">Delete</span>
        <small class="story-hostname">(${hostName})</small>
        <small class="story-author">by ${tempStory.author}</small>
        <small class="story-user">posted by ${tempStory.username}</small>
      </li>
    `);
  } else generateStoryMarkup(tempStory);
}
// on click of  elements with .delete class will make a request to delete the story from the API using deleteStoryToApi
$('body').on('click', '.delete', async function (evt) {
  const storyId = evt.target.parentElement.id;
  console.log('storyId', storyId);
  await currentUser.deleteStoryToApi(storyId);
});
// when image on body is clicked on it will grab the parent elements ID and add the story to api and user favorites , also changes the icon.src to checked.png. Although I don't think i'm supposed to mix data with ui.
async function favoriteOn(evt) {
  const icon = evt.target;
  const selectedStoryId = icon.parentElement.id;
  await currentUser.addFavoriteStoryToApi(selectedStoryId);
  currentUser.addFavoriteStoryToUserFavorites(selectedStoryId);
  // currentUser.favorites.unshift();
  icon.src = 'checked.png';
}

$('body').on('click', 'img', favoriteOn);

// when elements with the .remove class are clicked on it will make a request to remove the selected story from the API and the currentUser.favorites
async function favoriteOff(evt) {
  const icon = evt.target;
  const selectedStoryId = icon.parentElement.id;
  await currentUser.removeFavoriteStoryToApi(selectedStoryId);
  currentUser.removeFavoriteStoryToUserFavorites(selectedStoryId);
  evt.target.previousElementSibling.previousElementSibling.src = 'unchecked.png';
}

$('body').on('click', '.remove', favoriteOff);
/** Gets list of stories from server, generates their HTML, and puts on page. */

function putStoriesOnPage() {
  console.debug('putStoriesOnPage');
  $allStoriesList.empty();
  for (let story of storyList.stories) {
    const $story = generateStoryMarkup(story);
    $allStoriesList.append($story);
  }
  $allStoriesList.show();
}
// gets list of users favorite stories and generates their HTML and puts on page
function putFavoritesOnPage() {
  $allStoriesList.hide();
  $favStoriesList.empty();
  // loop through all of favorite stories and generate HTML for them

  if (currentUser.favorites.length > 0) {
    for (let favStory of currentUser.favorites) {
      const $story = generateFavoriteStoryMarkup(favStory);
      $favStoriesList.append($story);
    }
    $favStoriesList.show();
  } else return;
}
// grabs values from new-form inputs uses those to addStory to api and put on page
async function submitStory() {
  console.debug('submitStory');
  // select form values
  const newTitle = $('#new-title').val();
  const newAuthor = $('#new-author').val();
  const newUrl = $('#new-url').val();
  // call addStory to addStory to allStories
  await storyList.addStory(currentUser, { title: newTitle, author: newAuthor, url: newUrl });
  // use existing function to put allStories on page, will include new one
  putStoriesOnPage();
  console.log(storyList, 'storyList');
}
// click listener to submitStory, when submit-new-story button clicked
$('#submit-new-story').on('click', function (evt) {
  evt.preventDefault();
  submitStory();
  $newForm.hide();
});

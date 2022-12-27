'use strict';

// This is the global list of the stories, an instance of StoryList
let storyList;

/** Get and show stories when site first loads. */

async function getAndShowStoriesOnStart() {
  storyList = await StoryList.getStories();
  $storiesLoadingMsg.remove();

  putStoriesOnPage();
  putFavoritesOnPage();
}

/**
 * A render method to render HTML for an individual Story instance
 * - story: an instance of Story
 *
 * Returns the markup for the story.
 */

function generateStoryMarkup(tempStory) {
  const hostName = tempStory.getHostName(tempStory.url);
  if (currentUser) {
    console.log('currentUser + generateStoryMarkup');
    return $(`
      <li id="${tempStory.storyId}">
        <img data-id="${tempStory.storyId}" src="unchecked.png" height="10vh" width="10vw">
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
function generateFavoriteStoryMarkup(tempStory) {
  const hostName = tempStory.getHostName(tempStory.url);
  if (currentUser && currentUser.isFavorite(tempStory.storyId)) {
    return $(`
      <li id="${tempStory.storyId}">
        <img data-id="${tempStory.storyId}" src="checked.png" height="10vh" width="10vw">
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

$('body').on('click', '.delete', async function (evt) {
  const storyId = evt.target.parentElement.id;
  console.log('storyId', storyId);
  await currentUser.deleteStoryToApi(storyId);
});
async function favoriteOn(evt) {
  const icon = evt.target;
  const selectedStoryId = icon.parentElement.id;
  await currentUser.addFavoriteStoryToApi(selectedStoryId);
  // currentUser.favorites.unshift();
  icon.src = 'checked.png';
}

$('body').on('click', 'img', favoriteOn);

async function favoriteOff(evt) {
  const icon = evt.target;
  const selectedStoryId = icon.parentElement.id;
  await currentUser.removeFavoriteStoryToApi(selectedStoryId);
  evt.target.previousElementSibling.previousElementSibling.src = 'unchecked.png';
}

$('body').on('click', '.remove', favoriteOff);
/** Gets list of stories from server, generates their HTML, and puts on page. */

function putStoriesOnPage() {
  console.debug('putStoriesOnPage');

  $allStoriesList.empty();

  // loop through all of our stories and generate HTML for them
  for (let story of storyList.stories) {
    const $story = generateStoryMarkup(story);
    $allStoriesList.append($story);
  }

  $allStoriesList.show();
}

function putFavoritesOnPage() {
  $favStoriesList.empty();
  $allStoriesList.hide();
  // loop through all of our stories and generate HTML for them

  for (let favStory of currentUser.favorites) {
    const $story = generateFavoriteStoryMarkup(favStory);
    $favStoriesList.append($story);
  }
  $favStoriesList.show();
}

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

// ?? When generating the markup for stories, I thought I set logic to create the image source to checked.png if it is included in the currentUsers.favorites however it's not working.
// stories.js 42

'use strict';

const BASE_URL = 'https://hack-or-snooze-v3.herokuapp.com';

/******************************************************************************
 * Story: a single story in the system
 */

class Story {
  /** Make instance of Story from data object about story:
   *   - {title, author, url, username, storyId, createdAt}
   */

  constructor({ storyId, title, author, url, username, createdAt }) {
    this.storyId = storyId;
    this.title = title;
    this.author = author;
    this.url = url;
    this.username = username;
    this.createdAt = createdAt;
  }

  /** Parses hostname out of URL and returns it. */

  getHostName(tempURL) {
    const url = new URL(tempURL).hostname;
    return url;
  }
}

/******************************************************************************
 * List of Story instances: used by UI to show story lists in DOM.
 */

class StoryList {
  constructor(stories) {
    this.stories = stories;
  }

  /** Generate a new StoryList. It:
   *
   *  - calls the API
   *  - builds an array of Story instances
   *  - makes a single StoryList instance out of that
   *  - returns the StoryList instance.
   */

  static async getStories() {
    // Note presence of `static` keyword: this indicates that getStories is
    //  **not** an instance method. Rather, it is a method that is called on the
    //  class directly. Why doesn't it make sense for getStories to be an
    //  instance method?

    // query the /stories endpoint (no auth required)
    const response = await axios({
      url: `${BASE_URL}/stories`,
      method: 'GET',
    });

    // turn plain old story objects from API into instances of Story class
    const stories = response.data.stories.map((story) => new Story(story));

    // build an instance of our own class using the new array of stories
    return new StoryList(stories);
  }

  /** Adds story data to API, makes a Story instance, adds it to story list.
   * - user - the current instance of User who will post the story
   * - obj of {title, author, url}
   *
   * Returns the new Story instance
   */

  async addStory(user, newStory) {
    // Create story post to api
    const response = await axios.post(`${BASE_URL}/stories`, { token: user.loginToken, story: { author: newStory.author, title: newStory.title, url: newStory.url } });

    const story = new Story(response.data.story);
    this.stories.unshift(story);
    user.ownStories.unshift(story);
    return story;
  }

  async removeStory(user, storyId) {
    // const token = user.loginToken;
    await axios.delete(`${BASE_URL}/stories/${storyId}`, { token: user.loginToken });
  }
}

/******************************************************************************
 * User: a user in the system (only used to represent the current user)
 */

class User {
  /** Make user instance from obj of user data and a token:
   *   - {username, name, createdAt, favorites[], ownStories[]}
   *   - token
   */

  constructor({ username, name, createdAt, favorites = [], ownStories = [] }, token) {
    this.username = username;
    this.name = name;
    this.createdAt = createdAt;

    // instantiate Story instances for the user's favorites and ownStories
    this.favorites = favorites.map((s) => new Story(s));
    this.ownStories = ownStories.map((s) => new Story(s));

    // store the login token on the user so it's easy to find for API calls.
    this.loginToken = token;
  }

  /** Register new user in API, make User instance & return it.
   *
   * - username: a new username
   * - password: a new password
   * - name: the user's full name
   */

  static async signup(username, password, name) {
    const response = await axios({
      url: `${BASE_URL}/signup`,
      method: 'POST',
      data: { user: { username, password, name } },
    });

    let { user } = response.data;

    return new User(
      {
        username: user.username,
        name: user.name,
        createdAt: user.createdAt,
        favorites: user.favorites,
        ownStories: user.stories,
      },
      response.data.token
    );
  }

  /** Login in user with API, make User instance & return it.

   * - username: an existing user's username
   * - password: an existing user's password
   */

  static async login(username, password) {
    const response = await axios({
      url: `${BASE_URL}/login`,
      method: 'POST',
      data: { user: { username, password } },
    });

    let { user } = response.data;

    return new User(
      {
        username: user.username,
        name: user.name,
        createdAt: user.createdAt,
        favorites: user.favorites,
        ownStories: user.stories,
      },
      response.data.token
    );
  }

  /** When we already have credentials (token & username) for a user,
   *   we can log them in automatically. This function does that.
   */

  static async loginViaStoredCredentials(token, username) {
    console.debug('loginViaStoredCredentials');
    try {
      const response = await axios({
        url: `${BASE_URL}/users/${username}`,
        method: 'GET',
        params: { token },
      });

      let { user } = response.data;

      return new User(
        {
          username: user.username,
          name: user.name,
          createdAt: user.createdAt,
          favorites: user.favorites,
          ownStories: user.stories,
        },
        token
      );
    } catch (err) {
      console.error('loginViaStoredCredentials failed', err);
      return null;
    }
  }
  // **This function when called and given a storyId will make an add favorite request to the api for the currentUser
  async addFavoriteStoryToApi(storyId) {
    console.debug('addFavoriteStoryToApi');
    const response = await axios({
      url: `${BASE_URL}/users/${currentUser.username}/favorites/${storyId}`,
      method: 'POST',
      data: { token: currentUser.loginToken },
    });
  }
  // **When given a storyid it will add story to the currentUser.favorites
  async addFavoriteStoryToUserFavorites(storyId) {
    console.debug('addFavoriteStoryToUserFavorites');
    const res = await axios({
      url: `${BASE_URL}/stories/${storyId}`,
      method: 'GET',
    });
    currentUser.favorites.unshift(new Story(res.data.story));
  }
  // When given a storyId will remove story from currentUser.favorites
  async removeFavoriteStoryToUserFavorites(storyId) {
    console.debug('removeFavoriteStoryToUserFavorites');
    currentUser.favorites = currentUser.favorites.filter((tempFav) => tempFav.storyId !== storyId);
  }
  // **This function when called and given a storyId will make an remove favorite request to the api for the currentUser
  async removeFavoriteStoryToApi(storyId) {
    console.debug('removeFavoriteStoryToApi');
    const response = await axios({
      url: `${BASE_URL}/users/${currentUser.username}/favorites/${storyId}`,
      method: 'DELETE',
      data: { token: currentUser.loginToken },
    });
  }
  // ** This function when called and given a storyId will make an delete request to the api for the currentUser
  async deleteStoryToApi(storyId) {
    console.debug('deleteStoryToApi');
    try {
      const response = await axios.delete(`${BASE_URL}/stories/${storyId}`, { data: { token: currentUser.loginToken } });
      $(`#${storyId}`).remove();
    } catch (e) {
      alert('Only the creator may destroy');
    }
  }
  // ** This function when called and given a storyId will check to see if that storyId and the story it belongs to is currently in the currentUser.favorites array at all, if even one of the stories matches it will return true
  async isFavorite(storyId) {
    for (let favorite of currentUser.favorites) {
      return favorite.storyId === storyId;
    }
    // another way, but returns true if it is a favorite anywhere in the favorites
    // return currentUser.favorites.some(function (fav) {
    //   return fav.storyId === storyId ? true : false;
    // });
  }
}
// CURRENT

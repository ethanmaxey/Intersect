var access_token, refresh_token;

(function () {
  function getHashParams() {
    var hashParams = {};
    var e,
      r = /([^&;=]+)=?([^&;]*)/g,
      q = window.location.hash.substring(1);
    while ((e = r.exec(q))) {
      hashParams[e[1]] = decodeURIComponent(e[2]);
    }
    return hashParams;
  }

  var userProfileSource = document.getElementById("user-profile-template").innerHTML,
    userProfileTemplate = Handlebars.compile(userProfileSource),
    userProfilePlaceholder = document.getElementById("user-profile");

  var oauthSource = document.getElementById("oauth-template").innerHTML,
    oauthTemplate = Handlebars.compile(oauthSource),
    oauthPlaceholder = document.getElementById("oauth");

  var params = getHashParams();

  access_token = params.access_token;
  refresh_token = params.refresh_token;
  var error = params.error;

  if (error) {
    alert("There was an error during the authentication");
  } else {
    if (access_token) {
      oauthPlaceholder.innerHTML = oauthTemplate({
        access_token: access_token,
        refresh_token: refresh_token,
      });

      $.ajax({
        url: "https://api.spotify.com/v1/me",
        headers: {
          Authorization: "Bearer " + access_token,
        },
        success: function (response) {
          userProfilePlaceholder.innerHTML = userProfileTemplate(response);

          $("#login").hide();
          $("#loggedin").show();
        },
      });
    } else {
      $("#login").show();
      $("#loggedin").hide();
    }

    document
      .getElementById("obtain-new-token")
      .addEventListener("click", function () {
        $.ajax({
          url: "/refresh_token",
          data: {
            refresh_token: refresh_token,
          },
        }).done(function (data) {
          access_token = data.access_token;
          oauthPlaceholder.innerHTML = oauthTemplate({
            access_token: access_token,
            refresh_token: refresh_token,
          });
        });
      });
  }
})();

$("#createPlaylistButton").click(function () {
  $.ajax({
    url: "https://api.spotify.com/v1/me/top/tracks",
    headers: {
      Authorization: "Bearer " + access_token,
    },
    data: {
      limit: 150,
      time_range: "medium_term",
    },
    success: function (response) {
      var trackUris = response.items.map(function (item) {
        return item.uri;
      });

      console.log("Top Tracks:", response.items); // Log the top tracks to console

      createPlaylist(trackUris);
    },
    error: function (error) {
      console.log("Top Tracks Error:", error);
      // handle your error case
    },
  });
});

function createPlaylist(trackUris) {
  $.ajax({
    url: "https://api.spotify.com/v1/me/playlists",
    method: "POST",
    headers: {
      Authorization: "Bearer " + access_token,
      "Content-Type": "application/json",
    },
    data: JSON.stringify({
      name: "Intersect",
      description: "A playlist of my unique top 150 songs.",
      public: true,
    }),
    success: function (response) {
      var playlistId = response.id;

      console.log("Playlist Creation Response:", response); // Log the playlist creation response

      addTracksToPlaylist(playlistId, trackUris);
    },
    error: function (error) {
      console.log("Playlist Creation Error:", error);
      // handle your error case
    },
  });
}

function addTracksToPlaylist(playlistId, trackUris) {
  $.ajax({
    url: `https://api.spotify.com/v1/playlists/${playlistId}/tracks`,
    method: "POST",
    headers: {
      Authorization: "Bearer " + access_token,
      "Content-Type": "application/json",
    },
    data: JSON.stringify({
      uris: trackUris,
    }),
    success: function (response) {
      console.log("Tracks Added to Playlist:", response);
      console.log("Playlist created successfully.");
      // handle your success case
    },
    error: function (error) {
      console.log("Add Tracks to Playlist Error:", error);
      // handle your error case
    },
  });
}

$(document).ready(function() {
  var access_token, refresh_token;

  function getHashParams() {
      var hashParams = {};
      var e, r = /([^&;=]+)=?([^&;]*)/g,
          q = window.location.hash.substring(1);
      while (e = r.exec(q)) {
          hashParams[e[1]] = decodeURIComponent(e[2]);
      }
      return hashParams;
  }

  function updateUIWithUserProfile(response) {
      var userProfileSource = $("#user-profile-template").html(),
          userProfileTemplate = Handlebars.compile(userProfileSource),
          userProfilePlaceholder = $("#user-profile");
      userProfilePlaceholder.html(userProfileTemplate(response));
      $("#login").hide();
      $("#loggedin").show();
  }

  var params = getHashParams();

  access_token = params.access_token;
  refresh_token = params.refresh_token;
  var error = params.error;

  if (error) {
      alert("There was an error during the authentication");
  } else {
      if (access_token) {

          $.ajax({
              url: "https://api.spotify.com/v1/me",
              headers: {
                  Authorization: "Bearer " + access_token,
              },
              success: updateUIWithUserProfile
          });
      } else {
          $("#login").show();
          $("#loggedin").hide();
      }
  }

  $("#createPlaylistButton").click(function() {
      $.ajax({
          url: "https://api.spotify.com/v1/me/top/tracks",
          headers: {
              Authorization: "Bearer " + access_token,
          },
          data: {
              limit: 150,
              time_range: "medium_term",
          },
          success: function(response) {
              var trackUris = response.items.map(function(item) {
                  return item.uri;
              });
              createPlaylist(trackUris);
          },
          error: function(error) {
              console.error("Top Tracks Error:", error);
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
          success: function(response) {
              var playlistId = response.id;
              addTracksToPlaylist(playlistId, trackUris);
          },
          error: function(error) {
              console.error("Playlist Creation Error:", error);
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
          success: function(response) {
              console.log("Tracks Added to Playlist:", response);
          },
          error: function(error) {
              console.error("Add Tracks to Playlist Error:", error);
          },
      });
  }
});

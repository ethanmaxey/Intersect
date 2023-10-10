(function () {
    var access_token, refresh_token;

    function getHashParams() {
        var hashParams = {};
        var e, r = /([^&;=]+)=?([^&;]*)/g, q = window.location.hash.substring(1);
        while ((e = r.exec(q))) {
            hashParams[e[1]] = decodeURIComponent(e[2]);
        }
        return hashParams;
    }

    var userProfileSource = document.getElementById("user-profile-template").innerHTML,
        userProfileTemplate = Handlebars.compile(userProfileSource),
        userProfilePlaceholder = document.getElementById("user-profile");

    var params = getHashParams();
    access_token = params.access_token;
    refresh_token = params.refresh_token;

    if (params.error) {
        alert("There was an error during the authentication");
    } else if (access_token) {
        $.ajax({
            url: "https://api.spotify.com/v1/me",
            headers: { Authorization: "Bearer " + access_token },
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
})();
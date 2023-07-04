from flask import Flask, request
import spotipy, requests, base64

app = Flask(__name__)

@app.route('/create-playlist', methods=['POST'])
def create_playlist_endpoint():
    user_info = request.get_json()
    access_token = user_info['access_token']

    sp = spotipy.Spotify(auth=access_token)

    def find_top150_tracks():
        top_tracks = []
        time_ranges = ['short_term', 'medium_term', 'long_term']

        for time_range in time_ranges:
            results = sp.current_user_top_tracks(limit=50, time_range=time_range)['items']
            top_tracks.extend(results)

        unique_tracks = {track['id']: track for track in top_tracks}.values()
        return list(unique_tracks)

    def create_playlist_with_songs(song_list, playlist_name, cover_image_url):
        user_id = sp.me()['id']

        playlist = sp.user_playlist_create(user=user_id, name=playlist_name, public=False)
        playlist_id = playlist['id']

        image_response = requests.get(cover_image_url)
        image_data = image_response.content
        base64_image = base64.b64encode(image_data).decode("utf-8")
        sp.playlist_upload_cover_image(playlist_id, base64_image)

        chunk_size = 100
        for i in range(0, len(song_list), chunk_size):
            chunk = song_list[i: i + chunk_size]
            song_uris = [song['uri'] for song in chunk]
            sp.user_playlist_add_tracks(user=user_id, playlist_id=playlist_id, tracks=song_uris)

        return playlist

    def run():
        top_150_songs = find_top150_tracks()
        cover_image_url = "https://i.ibb.co/PwcMjbt/68747470733a2f2f662e636c6f75642e6769746875622e636f6d2f6173736574732f313031363638342f3831333336342f66.jpg"
        created_playlist = create_playlist_with_songs(top_150_songs, "Intersect", cover_image_url)
        print("Playlist created:", created_playlist['name'])

    run()
    return {"message": "Playlist created successfully"}, 200


if __name__ == "__main__":
    app.run(debug=True)

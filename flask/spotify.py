import spotipy, requests, base64, os
from spotipy.oauth2 import SpotifyOAuth
from dotenv import load_dotenv

load_dotenv()

spotify_client_id = os.getenv('SPOTIPY_CLIENT_ID')
spotify_client_secret= os.getenv('SPOTIPY_CLIENT_SECRET')
spotify_client_uri = os.getenv('SPOTIPY_REDIRECT_URI')
print("Client ID:", spotify_client_id)
print("Client Secret:", spotify_client_secret)
print("Redirect URI:", spotify_client_uri)


def find_top150_tracks():
    sp = spotipy.Spotify(auth_manager=SpotifyOAuth(
        client_id=spotify_client_id, 
        client_secret=spotify_client_secret, 
        redirect_uri=spotify_client_uri,
        scope='user-top-read'  # This scope is required to access the user's top tracks
    ))
    top_tracks = []
    time_ranges = ['short_term', 'medium_term', 'long_term']

    for time_range in time_ranges:
        results = sp.current_user_top_tracks(limit=50, time_range=time_range)['items']
        top_tracks.extend(results)

    unique_tracks = {track['id']: track for track in top_tracks}.values()
    return list(unique_tracks)


def create_playlist_with_songs(song_list, playlist_name, cover_image_url):
    sp = spotipy.Spotify(auth_manager=SpotifyOAuth(
        client_id=spotify_client_id, 
        client_secret=spotify_client_secret, 
        redirect_uri=spotify_client_uri,
        scope='playlist-modify-private playlist-modify-public ugc-image-upload'
    ))
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

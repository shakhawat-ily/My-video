const { createClient } = supabase;

const client = createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

const params = new URLSearchParams(
    window.location.search
);

const currentId = Number(
    params.get("id")
);

let videos = [];
let currentIndex = -1;


async function loadVideos() {

    const { data, error } = await client
        .from("videos")
        .select("*")
        .order("created_at", {
            ascending: true
        });

    if (error) {

        document.getElementById("videoTitle")
            .textContent = "Unable to load video.";

        console.error(error);

        return;
    }

    videos = data || [];

    currentIndex = videos.findIndex(function(video) {
        return Number(video.id) === currentId;
    });


    if (currentIndex === -1) {

        document.getElementById("videoTitle")
            .textContent = "Video not found.";

        return;
    }

    showCurrentVideo();
}


async function showCurrentVideo() {

    const video = videos[currentIndex];

    document.getElementById("videoTitle")
        .textContent = video.title;

    document.getElementById("videoDescription")
        .textContent = video.description || "";


    const { data, error } = await client
        .storage
        .from("videos")
        .createSignedUrl(
            video.file_path,
            3600
        );


    if (error) {

        console.error(error);

        document.getElementById("videoTitle")
            .textContent = "Unable to load video.";

        return;
    }


    const player =
        document.getElementById("videoPlayer");

    player.src = data.signedUrl;

    updateButtons();
}


function updateButtons() {

    const previousButton =
        document.getElementById(
            "previousButton"
        );

    const nextButton =
        document.getElementById(
            "nextButton"
        );


    previousButton.disabled =
        currentIndex <= 0;


    nextButton.disabled =
        currentIndex >= videos.length - 1;
}


document
    .getElementById("nextButton")
    .addEventListener("click", function() {

        if (
            currentIndex <
            videos.length - 1
        ) {

            const nextVideo =
                videos[currentIndex + 1];

            window.location.href =
                "video.html?id=" +
                nextVideo.id;
        }
    });


document
    .getElementById("previousButton")
    .addEventListener("click", function() {

        if (currentIndex > 0) {

            const previousVideo =
                videos[currentIndex - 1];

            window.location.href =
                "video.html?id=" +
                previousVideo.id;
        }
    });


loadVideos();

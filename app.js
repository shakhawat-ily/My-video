const { createClient } = supabase;

const client = createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

const videoList = document.getElementById("videoList");


async function loadVideos() {

    const { data, error } = await client
        .from("videos")
        .select("*")
        .order("created_at", {
            ascending: true
        });

    if (error) {

        videoList.innerHTML =
            "<p>Unable to load videos.</p>";

        console.error(error);

        return;
    }


    if (!data || data.length === 0) {

        videoList.innerHTML =
            "<p>No videos available yet.</p>";

        return;
    }


    videoList.innerHTML = "";


    data.forEach(function(video) {

        const card =
            document.createElement("div");

        card.className = "video-card";


        const title =
            document.createElement("h3");

        title.textContent =
            video.title;


        const description =
            document.createElement("p");

        description.textContent =
            video.description || "";


        const button =
            document.createElement("a");

        button.className =
            "watch-button";

        button.textContent =
            "Watch Video →";

        button.href =
            "video.html?id=" + video.id;


        card.appendChild(title);
        card.appendChild(description);
        card.appendChild(button);


        videoList.appendChild(card);

    });

}


loadVideos();

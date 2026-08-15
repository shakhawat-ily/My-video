const client = supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

const loginBox = document.getElementById("loginBox");
const adminPanel = document.getElementById("adminPanel");
const loginForm = document.getElementById("loginForm");
const loginMessage = document.getElementById("loginMessage");

async function checkSession() {
    const { data, error } = await client.auth.getSession();

    if (error) {
        console.error(error);
        loginMessage.textContent = error.message;
        return;
    }

    if (data.session) {
        loginBox.style.display = "none";
        adminPanel.style.display = "block";
        loadAdminVideos();
    } else {
        loginBox.style.display = "block";
        adminPanel.style.display = "none";
    }
}

loginForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    loginMessage.textContent = "Logging in...";

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    const { data, error } = await client.auth.signInWithPassword({
        email: email,
        password: password
    });

    if (error) {
        loginMessage.textContent = "Login failed: " + error.message;
        console.error("LOGIN ERROR:", error);
        return;
    }

    if (!data.session) {
        loginMessage.textContent = "Login failed: No session created.";
        return;
    }

    loginMessage.textContent = "";

    loginBox.style.display = "none";
    adminPanel.style.display = "block";

    loadAdminVideos();
});

document.getElementById("logoutButton").addEventListener(
    "click",
    async function () {

        await client.auth.signOut();

        loginBox.style.display = "block";
        adminPanel.style.display = "none";
    }
);

async function loadAdminVideos() {

    const container = document.getElementById("adminVideoList");

    const { data, error } = await client
        .from("videos")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) {
        container.textContent = error.message;
        return;
    }

    container.innerHTML = "";

    if (!data || data.length === 0) {
        container.textContent = "No videos uploaded.";
        return;
    }

    data.forEach(function (video) {

        const item = document.createElement("div");

        item.className = "admin-video-item";

        const title = document.createElement("strong");
        title.textContent = video.title;

        const button = document.createElement("button");

        button.textContent = "Delete";
        button.className = "delete-button";

        button.addEventListener("click", function () {
            deleteVideo(video.id, video.file_path);
        });

        item.appendChild(title);
        item.appendChild(button);

        container.appendChild(item);
    });
}

async function deleteVideo(id, filePath) {

    if (!confirm("Delete this video?")) {
        return;
    }

    const { error: storageError } = await client.storage
        .from("videos")
        .remove([filePath]);

    if (storageError) {
        alert(storageError.message);
        return;
    }

    const { error: databaseError } = await client
        .from("videos")
        .delete()
        .eq("id", id);

    if (databaseError) {
        alert(databaseError.message);
        return;
    }

    loadAdminVideos();
}

document.getElementById("uploadForm").addEventListener(
    "submit",
    async function (event) {

        event.preventDefault();

        const title = document
            .getElementById("videoTitle")
            .value
            .trim();

        const description = document
            .getElementById("videoDescription")
            .value
            .trim();

        const file = document
            .getElementById("videoFile")
            .files[0];

        const message = document.getElementById("uploadMessage");

        if (!file) {
            message.textContent = "Please select a video.";
            return;
        }

        message.textContent = "Uploading...";

        const extension = file.name.split(".").pop();

        const fileName =
            crypto.randomUUID() + "." + extension;

        const { error: uploadError } = await client.storage
            .from("videos")
            .upload(fileName, file, {
                contentType: file.type,
                upsert: false
            });

        if (uploadError) {
            message.textContent =
                "Upload failed: " + uploadError.message;
            return;
        }

        const { error: databaseError } = await client
            .from("videos")
            .insert({
                title: title,
                description: description,
                file_path: fileName
            });

        if (databaseError) {

            await client.storage
                .from("videos")
                .remove([fileName]);

            message.textContent =
                "Database error: " + databaseError.message;

            return;
        }

        message.textContent =
            "Video uploaded successfully.";

        document.getElementById("uploadForm").reset();

        loadAdminVideos();
    }
);

checkSession();

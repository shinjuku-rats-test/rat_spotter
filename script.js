document.addEventListener('DOMContentLoaded', () => {
    const app = document.getElementById('app');
    const titleScreen = document.getElementById('title-screen');
    const homeScreen = document.getElementById('home-screen');
    const cameraScreen = document.getElementById('camera-screen');
    const mapScreen = document.getElementById('map-screen');
    const reportsScreen = document.getElementById('reports-screen');
    const profileScreen = document.getElementById('profile-screen');

    const startButton = document.getElementById('start-button');
    const reportStartButton = document.getElementById('report-start-button'); // ホーム画面の報告開始ボタン

    const menuItems = document.querySelectorAll('.menu-item');
    const cameraBtn = document.getElementById('camera-btn');
    const mapBtn = document.getElementById('map-btn');
    const homeBtn = document.getElementById('home-btn');
    const reportsBtn = document.getElementById('reports-btn');
    const profileBtn = document.getElementById('profile-btn');
    const backButtons = document.querySelectorAll('.back-button');

    // カメラ機能関連
    const video = document.getElementById('video');
    const snapButton = document.getElementById('snap');
    const canvas = document.getElementById('canvas');
    const context = canvas.getContext('2d');
    const uploadPhotoButton = document.getElementById('upload-photo');
    let stream; // カメラのストリームを保持

    // マップ機能関連
    let map;
    let marker;

    // プロフィール関連
    const editUsernameBtn = document.getElementById('edit-username-btn');
    const displayUsername = document.getElementById('display-username');
    const changeIconBtn = document.getElementById('change-icon-btn');
    const uploadIcon = document.getElementById('upload-icon');
    const displayIcon = document.getElementById('display-icon');
    const displayPoints = document.getElementById('display-points');
    let userPoints = 0; // ユーザーのポイント

    // 画面切り替え関数
    function showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        document.getElementById(screenId).classList.add('active');

        // カメラ画面から離れるときにカメラを停止
        if (screenId !== 'camera-screen' && stream) {
            stream.getTracks().forEach(track => track.stop());
            video.srcObject = null;
        }
        // マップ画面から離れるときにマーカーをクリア
        if (screenId !== 'map-screen' && map && marker) {
            marker.setMap(null);
            marker = null;
        }

        // メニューバーのアクティブ状態を更新
        menuItems.forEach(item => item.classList.remove('active'));
        const activeMenuItem = document.querySelector(`#${screenId.replace('-screen', '-btn')}`);
        if (activeMenuItem) {
            activeMenuItem.classList.add('active');
        }
    }

    // イベントリスナー
    startButton.addEventListener('click', () => {
        showScreen('home-screen');
    });

    reportStartButton.addEventListener('click', () => {
        showScreen('camera-screen'); // またはマップ画面
    });

    homeBtn.addEventListener('click', () => showScreen('home-screen'));
    cameraBtn.addEventListener('click', () => showScreen('camera-screen'));
    mapBtn.addEventListener('click', () => showScreen('map-screen'));
    reportsBtn.addEventListener('click', () => showScreen('reports-screen'));
    profileBtn.addEventListener('click', () => showScreen('profile-screen'));

    backButtons.forEach(button => {
        button.addEventListener('click', () => showScreen('home-screen')); // 全ての戻るボタンはホームへ
    });

    // MARK: - カメラ機能
    cameraBtn.addEventListener('click', async () => {
        showScreen('camera-screen');
        try {
            stream = await navigator.mediaDevices.getUserMedia({ video: true });
            video.srcObject = stream;
            video.play();
            canvas.style.display = 'none'; // 初期はキャンバスを非表示
            uploadPhotoButton.style.display = 'none';
        } catch (err) {
            console.error('カメラのアクセスに失敗しました:', err);
            alert('カメラにアクセスできませんでした。権限を確認してください。');
        }
    });

    snapButton.addEventListener('click', () => {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.style.display = 'block'; // キャンバスを表示
        uploadPhotoButton.style.display = 'block'; // アップロードボタンを表示
        video.pause(); // ビデオを一時停止
    });

    uploadPhotoButton.addEventListener('click', () => {
        // ここで画像をサーバーにアップロードする処理を実装
        // 例: canvas.toDataURL('image/png') で画像データを取得
        const imageData = canvas.toDataURL('image/png');
        console.log('画像をアップロード:', imageData);
        alert('画像をアップロードしました！ポイントが付与されました！');
        addPoints(10); // 報告で10ポイント付与
        addReportToList('写真で報告しました。');
        showScreen('home-screen'); // ホーム画面に戻る
    });

    // MARK: - マップ機能 (Google Maps APIを想定)
    mapBtn.addEventListener('click', () => {
        showScreen('map-screen');
        if (!map) {
            initMap();
        } else {
            // マップがすでに初期化されている場合は、現在地を中心に表示
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition((position) => {
                    const userLatLng = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    };
                    map.setCenter(userLatLng);
                }, () => {
                    console.error('位置情報取得に失敗しました。');
                    map.setCenter({ lat: 35.690921, lng: 139.700595 }); // 新宿駅
                });
            }
        }
    });

    function initMap() {
        const defaultLocation = { lat: 35.690921, lng: 139.700595 }; // 新宿駅
        map = new google.maps.Map(document.getElementById('map'), {
            center: defaultLocation,
            zoom: 15,
        });

        // ユーザーの現在地を取得し、マップの中心に設定
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((position) => {
                const userLatLng = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                map.setCenter(userLatLng);
                // 現在地にマーカーを置くことも可能
                // new google.maps.Marker({
                //     position: userLatLng,
                //     map: map,
                //     title: '現在地'
                // });
            }, () => {
                console.error('位置情報取得に失敗しました。');
            });
        }

        // マップクリックでピンを立てる
        map.addListener('click', (event) => {
            if (marker) {
                marker.setMap(null); // 既存のマーカーを削除
            }
            marker = new google.maps.Marker({
                position: event.latLng,
                map: map,
                title: '報告場所'
            });
        });
    }

    document.getElementById('report-location-btn').addEventListener('click', () => {
        if (marker) {
            const lat = marker.getPosition().lat();
            const lng = marker.getPosition().lng();
            console.log(`マップで報告: 緯度 ${lat}, 経度 ${lng}`);
            alert(`緯度 ${lat}, 経度 ${lng} で報告しました！ポイントが付与されました！`);
            addPoints(10); // 報告で10ポイント付与
            addReportToList(`マップで報告しました (緯度: ${lat.toFixed(4)}, 経度: ${lng.toFixed(4)})`);
            showScreen('home-screen'); // ホーム画面に戻る
        } else {
            alert('マップ上にピンを立ててから報告してください。');
        }
    });

    // MARK: - レポート機能
    function addReportToList(reportText) {
        const reportList = document.getElementById('report-list');
        const listItem = document.createElement('li');
        listItem.textContent = `${new Date().toLocaleString()}: ${reportText}`;
        reportList.prepend(listItem); // 新しい報告をリストの先頭に追加
    }

    // MARK: - プロフィール機能
    editUsernameBtn.addEventListener('click', () => {
        const newUsername = prompt('新しいユーザー名を入力してください:', displayUsername.textContent);
        if (newUsername && newUsername.trim() !== '') {
            displayUsername.textContent = newUsername.trim();
            // ここでユーザー名をローカルストレージなどに保存する処理も追加
        }
    });

    changeIconBtn.addEventListener('click', () => {
        uploadIcon.click(); // 非表示のファイル選択inputをクリック
    });

    uploadIcon.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                displayIcon.src = e.target.result;
                // ここでアイコン画像をローカルストレージなどに保存する処理も追加
            };
            reader.readAsDataURL(file);
        }
    });

    function addPoints(amount) {
        userPoints += amount;
        displayPoints.textContent = userPoints;
        // ここでポイント情報をローカルストレージなどに保存する処理も追加
    }

    // アプリ起動時にタイトル画面を表示
    showScreen('title-screen');

    // Google Maps APIのスクリプトを動的に読み込む（APIキーが必要）
    // `<YOUR_API_KEY>` を実際のGoogle Maps JavaScript APIキーに置き換えてください
    const googleMapsApiKey = 'YOUR_API_KEY';
    if (googleMapsApiKey !== 'YOUR_API_KEY') {
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${googleMapsApiKey}&callback=initMap`;
        script.async = true;
        document.head.appendChild(script);
    } else {
        console.warn('Google Maps APIキーが設定されていません。マップ機能は動作しません。');
        alert('Google Maps APIキーを設定してください。');
    }
});
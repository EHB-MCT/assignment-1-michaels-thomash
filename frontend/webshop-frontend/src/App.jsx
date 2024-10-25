import { useEffect, useState } from "react";
import { fetchWallpapers } from "./api";

function App() {
	const [wallpapers, setWallpapers] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	useEffect(() => {
		const getWallpapers = async () => {
			try {
				const wallpapersData = await fetchWallpapers();
				setWallpapers(wallpapersData);
				setLoading(false);
			} catch (error) {
				setError(error.message);
				setLoading(false);
			}
		};

		getWallpapers();
	}, []);

	if (loading) return <p>Loading...</p>;
	if (error) return <p>Error: {error}</p>;

	return (
		<div className="App">
			<h1>Wallpapers</h1>
			{wallpapers.length === 0 ? (
				<p>No wallpapers available</p>
			) : (
				<ul>
					{wallpapers.map((wallpaper) => (
						<li key={wallpaper.id}>
							<h3>{wallpaper.name}</h3>
							<img src={wallpaper.imageURL} alt={wallpaper.name} width="200" />
							<p>{wallpaper.price}</p>
							<p>{wallpaper.description}</p>
						</li>
					))}
				</ul>
			)}
		</div>
	);
}

export default App;

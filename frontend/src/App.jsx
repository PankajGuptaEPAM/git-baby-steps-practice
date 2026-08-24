import { useEffect, useState } from 'react';
import { NavLink, Route, Routes } from 'react-router-dom';

const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';

function Dashboard() {
	return (
		<section className="panel">
			<p className="eyebrow">Current sprint</p>
			<h2>Weekly status workspace</h2>
			<p className="muted">Report generation will appear here as feature increments are delivered.</p>
			<div className="metric-grid">
				<div className="metric"><span>RAG status</span><strong className="status-pending">Pending</strong></div>
				<div className="metric"><span>Story points</span><strong>--</strong></div>
				<div className="metric"><span>Completion</span><strong>--</strong></div>
			</div>
		</section>
	);
}

function Preview() {
	return <section className="panel"><p className="eyebrow">Review</p><h2>Report preview</h2><p className="muted">A generated report preview will be available here.</p></section>;
}

function PublishStatus() {
	return <section className="panel"><p className="eyebrow">Delivery</p><h2>Publish status</h2><p className="muted">Publishing controls will be enabled after report generation is implemented.</p></section>;
}

function Health() {
	const [health, setHealth] = useState(null);
	const [error, setError] = useState('');

	useEffect(() => {
		fetch(`${apiBaseUrl}/api/health`)
			.then(async (response) => {
				const body = await response.json();
				if (!response.ok && response.status !== 503) throw new Error(body.error?.message || 'Backend unavailable');
				return body;
			})
			.then(setHealth)
			.catch((requestError) => setError(requestError.message));
	}, []);

	return (
		<section className="panel">
			<p className="eyebrow">Operations</p>
			<h2>Service health</h2>
			{error && <p className="message error">{error}</p>}
			{!health && !error && <p className="muted">Checking backend readiness...</p>}
			{health && <div className="health-list"><div><span>Application</span><strong>{health.application.ready ? 'Ready' : 'Unavailable'}</strong></div><div><span>Database</span><strong>{health.database.ready ? 'Ready' : 'Unavailable'}</strong></div></div>}
		</section>
	);
}

export default function App() {
	return (
		<div className="app-shell">
			<header className="topbar">
				<div><p className="eyebrow">Diamond Industry Marketplace</p><h1>Weekly Status Report</h1></div>
				<span className="version-chip">Foundation</span>
			</header>
			<nav className="navigation" aria-label="Primary navigation">
				<NavLink to="/">Dashboard</NavLink>
				<NavLink to="/preview">Preview</NavLink>
				<NavLink to="/publish">Publish status</NavLink>
				<NavLink to="/health">Service health</NavLink>
			</nav>
			<main><Routes><Route path="/" element={<Dashboard />} /><Route path="/preview" element={<Preview />} /><Route path="/publish" element={<PublishStatus />} /><Route path="/health" element={<Health />} /></Routes></main>
		</div>
	);
}

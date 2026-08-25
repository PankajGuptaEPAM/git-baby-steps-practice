import { useEffect, useState } from 'react';
import { NavLink, Route, Routes, useNavigate } from 'react-router-dom';
import { api } from './services/api';

const REPORT_KEY = 'wsrg_report';
const saveReport = (id, report) => { try { localStorage.setItem(REPORT_KEY, JSON.stringify({ id, report })); } catch {} };
const loadReport = () => { try { return JSON.parse(localStorage.getItem(REPORT_KEY) || 'null'); } catch { return null; } };

function RagBadge({ status }) {
	const cls = status === 'GREEN' ? 'rag-green' : status === 'AMBER' ? 'rag-amber' : status === 'RED' ? 'rag-red' : 'status-pending';
	return <strong className={cls}>{status || 'Pending'}</strong>;
}

function ReportTable({ headers, rows, empty }) {
	if (!rows || rows.length === 0) return <p className="muted">{empty || 'None this sprint.'}</p>;
	return (
		<table className="report-table">
			<thead><tr>{headers.map(h => <th key={h}>{h}</th>)}</tr></thead>
			<tbody>{rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j}>{c ?? '-'}</td>)}</tr>)}</tbody>
		</table>
	);
}

function ReportSections({ report }) {
	const s = report.executiveSummary;
	const p = report.sprintProgress;
	return (
		<div className="report-sections">
			<div className="report-section">
				<h3>1. Executive Summary</h3>
				<div className="metric-grid">
					<div className="metric"><span>RAG Status</span><RagBadge status={s.ragStatus} /></div>
					<div className="metric"><span>Story Points</span><strong>{s.completedPoints}/{s.committedPoints}</strong></div>
					<div className="metric"><span>Completion</span><strong>{s.completionPercentage}%</strong></div>
				</div>
				<p className="summary-detail"><strong>Sprint:</strong> {s.sprintName}</p>
				<p className="summary-detail"><strong>Period:</strong> {s.sprintStartDate ? s.sprintStartDate.slice(0, 10) : '-'} → {s.sprintEndDate ? s.sprintEndDate.slice(0, 10) : '-'}</p>
				<p className="summary-detail"><strong>Highlight:</strong> {s.highlight}</p>
				<p className="summary-detail"><strong>Risk:</strong> {s.risk}</p>
			</div>
			<div className="report-section">
				<h3>2. Sprint Progress</h3>
				<ReportTable headers={['Metric', 'Value']} rows={[['Committed Points', p.committedPoints], ['Completed Points', p.completedPoints], ['Remaining Points', p.remainingPoints], ['% Done', `${p.percentageDone}%`], ['Total Tickets', p.totalTickets], ['Completed Tickets', p.completedTickets]]} />
			</div>
			<div className="report-section">
				<h3>3. Completed Issues</h3>
				<ReportTable headers={['Ticket', 'Summary', 'Assignee', 'Points', 'Resolved']} rows={report.completedIssues.map(i => [i.ticketId, i.summary, i.assignee, i.storyPoints, i.resolvedDate])} />
			</div>
			<div className="report-section">
				<h3>4. In-Progress Items</h3>
				<ReportTable headers={['Ticket', 'Summary', 'Assignee', 'Status', '% Done', 'Due']} rows={report.inProgressItems.map(i => [i.ticketId, i.summary, i.assignee, i.status, `${i.percentageDone}%`, i.dueDate])} />
			</div>
			<div className="report-section">
				<h3>5. Blockers / Flagged Issues</h3>
				<ReportTable headers={['Ticket', 'Summary', 'Description', 'Assignee', 'Flagged Since']} rows={report.blockers.map(b => [b.ticketId, b.summary, b.blockerDescription, b.assignee, b.flaggedSince])} />
			</div>
			<div className="report-section">
				<h3>6. Team Workload</h3>
				<ReportTable headers={['Assignee', 'Assigned', 'Completed', 'In Progress', 'Points']} rows={report.teamWorkload.map(m => [m.assignee, m.assigned, m.completed, m.inProgress, m.storyPoints])} />
			</div>
			<div className="report-section">
				<h3>7. Bug Trend</h3>
				<ReportTable headers={['Sprint', 'Bugs Opened', 'Bugs Closed', 'Net Change']} rows={report.bugTrend.map(b => [b.sprint, b.bugsOpened, b.bugsClosed, b.netChange])} />
			</div>
			<div className="report-section">
				<h3>8. Velocity Trend</h3>
				<ReportTable headers={['Sprint', 'Committed', 'Completed', 'Velocity %']} rows={report.velocityTrend.map(v => [v.sprintName, v.committed, v.completed, `${v.velocityPercentage}%`])} empty="No historical sprint data." />
			</div>
			<div className="report-section">
				<h3>9. Next Sprint Goals</h3>
				<ReportTable headers={['Ticket', 'Summary', 'Priority', 'Points']} rows={report.nextSprintGoals.map(g => [g.ticketId, g.summary, g.priority, g.storyPoints])} empty="None scheduled." />
			</div>
		</div>
	);
}

function Dashboard() {
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');
	const [saved, setSaved] = useState(loadReport);
	const navigate = useNavigate();

	const handleGenerate = async () => {
		setLoading(true); setError('');
		try {
			const res = await api.createReport();
			if (!res.data?.data?.report) { setError(res.data?.message || 'No active sprint found.'); return; }
			const { reportId, report } = res.data.data;
			saveReport(reportId, report);
			setSaved({ id: reportId, report });
		} catch (err) {
			setError(err.message);
		} finally {
			setLoading(false);
		}
	};

	const report = saved?.report;
	return (
		<section className="panel">
			<p className="eyebrow">Current sprint</p>
			<h2>Weekly status workspace</h2>
			{error && <p className="message error" role="alert">{error}</p>}
			{!report && (
				<div className="metric-grid">
					<div className="metric"><span>RAG status</span><strong className="status-pending">Pending</strong></div>
					<div className="metric"><span>Story points</span><strong>--</strong></div>
					<div className="metric"><span>Completion</span><strong>--</strong></div>
				</div>
			)}
			<div className="action-bar">
				<button className="btn-primary" onClick={handleGenerate} disabled={loading} aria-label={saved ? 'Refresh report' : 'Generate report'}>
					{loading ? 'Generating…' : saved ? 'Refresh Report' : 'Generate Report'}
				</button>
				{saved && <button className="btn-secondary" onClick={() => navigate('/preview')} aria-label="Open report preview">Open Preview</button>}
			</div>
			{report && <ReportSections report={report} />}
		</section>
	);
}

function Preview() {
	const navigate = useNavigate();
	const saved = loadReport();
	const report = saved?.report;
	if (!report) {
		return (
			<section className="panel">
				<p className="eyebrow">Review</p>
				<h2>Report preview</h2>
				<p className="muted">No report generated yet.</p>
				<button className="btn-secondary" onClick={() => navigate('/')} aria-label="Go to dashboard">Back to Dashboard</button>
			</section>
		);
	}
	return (
		<section className="panel">
			<p className="eyebrow">Review</p>
			<h2>Report preview</h2>
			<p className="muted">Proposed title: <strong>Weekly Status Report - {report.reportDate}</strong></p>
			<p className="muted">Generated: {report.generatedAt}</p>
			<div className="action-bar">
				<button className="btn-secondary" onClick={() => navigate('/')} aria-label="Return to dashboard">Back to Dashboard</button>
				<button className="btn-primary" onClick={() => navigate('/publish')} aria-label="Proceed to publish">Proceed to Publish</button>
			</div>
			<ReportSections report={report} />
		</section>
	);
}

function PublishStatus() {
	const [loading, setLoading] = useState(false);
	const [result, setResult] = useState(null);
	const [error, setError] = useState('');
	const navigate = useNavigate();
	const saved = loadReport();

	const handlePublish = async () => {
		if (!saved?.id) return;
		setLoading(true); setError(''); setResult(null);
		try {
			const res = await api.publishReport(saved.id);
			if (res.data?.error) {
				setError(res.data.error.message);
				if (res.data.data?.fallbackFilePath) setResult({ fallback: res.data.data.fallbackFilePath });
			} else {
				setResult(res.data.data);
			}
		} catch (err) {
			setError(err.message);
		} finally {
			setLoading(false);
		}
	};

	return (
		<section className="panel">
			<p className="eyebrow">Delivery</p>
			<h2>Publish status</h2>
			{!saved && <p className="muted">No report ready to publish. <button className="btn-link" onClick={() => navigate('/')}>Generate a report first.</button></p>}
			{saved && !result && (
				<>
					<p className="muted">Ready to publish: <strong>Weekly Status Report - {saved.report?.reportDate}</strong></p>
					{error && <p className="message error" role="alert">{error}</p>}
					<div className="action-bar">
						<button className="btn-secondary" onClick={() => navigate('/preview')} aria-label="Return to preview">Back to Preview</button>
						<button className="btn-primary" onClick={handlePublish} disabled={loading} aria-label="Publish to Confluence">
							{loading ? 'Publishing…' : 'Publish to Confluence'}
						</button>
					</div>
				</>
			)}
			{result?.pageUrl && (
				<div className="message success">
					<p>Published successfully.</p>
					<p><a href={result.pageUrl} target="_blank" rel="noreferrer">{result.title}</a></p>
				</div>
			)}
			{result?.fallback && (
				<div className="message warning">
					<p>Confluence unavailable. Report saved locally:</p>
					<code>{result.fallback}</code>
				</div>
			)}
		</section>
	);
}

function Health() {
	const [health, setHealth] = useState(null);
	const [error, setError] = useState('');

	useEffect(() => {
		api.getHealth()
			.then(res => setHealth(res.data))
			.catch(err => setError(err.message));
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

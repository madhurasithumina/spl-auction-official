import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import './Reports.css';

const Reports = () => {
  const navigate = useNavigate();
  const [players, setPlayers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reportType, setReportType] = useState('all-players');
  const [selectedTeam, setSelectedTeam] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [playersRes, teamsRes] = await Promise.all([
        axios.get('http://localhost:8081/backend/api/players.php'),
        axios.get('http://localhost:8081/backend/api/teams.php')
      ]);
      setPlayers(playersRes.data);
      setTeams(teamsRes.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('username');
    navigate('/login');
  };

  const getFilteredPlayers = () => {
    if (reportType === 'all-players') {
      return players;
    } else if (reportType === 'sold-players') {
      return players.filter(p => p.sold_status === 'Sold');
    } else if (reportType === 'unsold-players') {
      return players.filter(p => p.sold_status === 'Unsold');
    } else if (reportType === 'available-players') {
      return players.filter(p => p.sold_status === 'Available');
    } else if (reportType === 'team-wise' && selectedTeam) {
      const team = teams.find(t => t.team_name === selectedTeam);
      return team ? team.players : [];
    }
    return [];
  };

  // Generate PDF Report
  const generatePDF = () => {
    const doc = new jsPDF();
    const filteredPlayers = getFilteredPlayers();

    // Add title
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('SPL Cricket Auction Report', 105, 20, { align: 'center' });
    
    // Add subtitle
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    let subtitle = '';
    if (reportType === 'all-players') subtitle = 'All Players Report';
    else if (reportType === 'sold-players') subtitle = 'Sold Players Report';
    else if (reportType === 'unsold-players') subtitle = 'Unsold Players Report';
    else if (reportType === 'available-players') subtitle = 'Available Players Report';
    else if (reportType === 'team-wise') subtitle = `${selectedTeam} Team Report`;
    
    doc.text(subtitle, 105, 30, { align: 'center' });
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 105, 37, { align: 'center' });

    // Prepare table data
    const tableData = filteredPlayers.map((player, index) => [
      index + 1,
      player.player_name,
      player.age,
      player.batting_side,
      player.bowling_side,
      player.bowling_style,
      player.sold_status || 'Available',
      player.sold_team || '-',
      player.player_role && player.player_role !== 'Regular' ? player.player_role : '-',
      player.sold_value ? `LKR ${player.sold_value.toLocaleString()}` : '-'
    ]);

    // Add table
    doc.autoTable({
      startY: 45,
      head: [['#', 'Player Name', 'Age', 'Batting', 'Bowling', 'Style', 'Status', 'Team', 'Role', 'Value']],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: [30, 60, 114],
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 10
      },
      bodyStyles: {
        fontSize: 9
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      },
      margin: { top: 45 },
      columnStyles: {
        8: { cellWidth: 20 } // Role column
      }
    });

    // Add summary if team-wise report
    if (reportType === 'team-wise' && selectedTeam) {
      const team = teams.find(t => t.team_name === selectedTeam);
      if (team) {
        const finalY = doc.lastAutoTable.finalY + 10;
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Team Summary:', 14, finalY);
        doc.setFont('helvetica', 'normal');
        doc.text(`Total Players: ${team.players?.length || 0}`, 14, finalY + 7);
        const totalSpent = (Number(team.initial_budget) || 0) - (Number(team.remaining_budget) || 0);
        doc.text(`Total Spent: LKR ${totalSpent.toLocaleString()}`, 14, finalY + 14);
        doc.text(`Remaining Budget: LKR ${(Number(team.remaining_budget) || 0).toLocaleString()}`, 14, finalY + 21);
      }
    }

    // Add footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.text(`Page ${i} of ${pageCount}`, doc.internal.pageSize.width / 2, doc.internal.pageSize.height - 10, { align: 'center' });
      doc.text('SPL Cricket Auction System', 14, doc.internal.pageSize.height - 10);
    }

    // Save PDF
    const fileName = `SPL_${reportType}_${new Date().getTime()}.pdf`;
    doc.save(fileName);
  };

  // Generate Excel Report
  const generateExcel = () => {
    const filteredPlayers = getFilteredPlayers();

    // Prepare data
    const excelData = filteredPlayers.map((player, index) => ({
      'No': index + 1,
      'Player Name': player.player_name,
      'Age': player.age,
      'Batting Side': player.batting_side,
      'Bowling Side': player.bowling_side,
      'Bowling Style': player.bowling_style,
      'Status': player.sold_status || 'Available',
      'Team': player.sold_team || '-',
      'Role': player.player_role && player.player_role !== 'Regular' ? player.player_role : '-',
      'Sold Value (LKR)': player.sold_value || 0
    }));

    // Create worksheet
    const worksheet = XLSX.utils.json_to_sheet(excelData);

    // Set column widths
    const columnWidths = [
      { wch: 5 },  // No
      { wch: 25 }, // Player Name
      { wch: 8 },  // Age
      { wch: 12 }, // Batting Side
      { wch: 12 }, // Bowling Side
      { wch: 15 }, // Bowling Style
      { wch: 12 }, // Status
      { wch: 15 }, // Team
      { wch: 12 }, // Role
      { wch: 15 }  // Sold Value
    ];
    worksheet['!cols'] = columnWidths;

    // Create workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Players');

    // Add team summary sheet if team-wise report
    if (reportType === 'team-wise' && selectedTeam) {
      const team = teams.find(t => t.team_name === selectedTeam);
      if (team) {
        const totalSpent = (Number(team.initial_budget) || 0) - (Number(team.remaining_budget) || 0);
        const summaryData = [
          { 'Metric': 'Team Name', 'Value': team.team_name },
          { 'Metric': 'Total Players', 'Value': team.players?.length || 0 },
          { 'Metric': 'Initial Budget', 'Value': `LKR ${(Number(team.initial_budget) || 0).toLocaleString()}` },
          { 'Metric': 'Total Spent', 'Value': `LKR ${totalSpent.toLocaleString()}` },
          { 'Metric': 'Remaining Budget', 'Value': `LKR ${(Number(team.remaining_budget) || 0).toLocaleString()}` }
        ];
        const summarySheet = XLSX.utils.json_to_sheet(summaryData);
        summarySheet['!cols'] = [{ wch: 20 }, { wch: 25 }];
        XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');
      }
    }

    // Save Excel file
    const fileName = `SPL_${reportType}_${new Date().getTime()}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  // Generate All Teams Excel Report
  const generateAllTeamsExcel = () => {
    const workbook = XLSX.utils.book_new();

    teams.forEach(team => {
      const teamPlayers = (team.players || []).map((player, index) => ({
        'No': index + 1,
        'Player Name': player.player_name,
        'Age': player.age,
        'Batting Side': player.batting_side,
        'Bowling Side': player.bowling_side,
        'Bowling Style': player.bowling_style,
        'Sold Value (LKR)': player.sold_value || 0
      }));

      const worksheet = XLSX.utils.json_to_sheet(teamPlayers);
      worksheet['!cols'] = [
        { wch: 5 }, { wch: 25 }, { wch: 8 }, { wch: 12 }, 
        { wch: 12 }, { wch: 15 }, { wch: 15 }
      ];
      
      XLSX.utils.book_append_sheet(workbook, worksheet, team.team_name);
    });

    // Add summary sheet
    const summaryData = teams.map(team => {
      const totalSpent = (Number(team.initial_budget) || 0) - (Number(team.remaining_budget) || 0);
      return {
        'Team': team.team_name,
        'Players': team.players?.length || 0,
        'Initial Budget': `LKR ${(Number(team.initial_budget) || 0).toLocaleString()}`,
        'Total Spent': `LKR ${totalSpent.toLocaleString()}`,
        'Remaining': `LKR ${(Number(team.remaining_budget) || 0).toLocaleString()}`
      };
    });
    
    const summarySheet = XLSX.utils.json_to_sheet(summaryData);
    summarySheet['!cols'] = [{ wch: 15 }, { wch: 10 }, { wch: 15 }, { wch: 15 }, { wch: 15 }];
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

    XLSX.writeFile(workbook, `SPL_All_Teams_Report_${new Date().getTime()}.xlsx`);
  };

  const getTeamColor = (teamName) => {
    const colors = {
      'Software': '#667eea',
      'Marketing': '#f093fb',
      'Technical': '#4facfe',
      'Accounts': '#43e97b'
    };
    return colors[teamName] || '#667eea';
  };

  return (
    <div className="reports-container">
      {/* Header */}
      <header className="reports-header">
        <div className="header-content">
          <div className="logo" onClick={() => navigate('/')}>
            <div className="cricket-ball-small"></div>
            <h1>SPL AUCTION</h1>
          </div>
          <nav className="nav-menu">
            <button className="nav-button" onClick={() => navigate('/')}>Home</button>
            <button className="nav-button" onClick={() => navigate('/view-players')}>View Players</button>
            <button className="nav-button" onClick={() => navigate('/auction')}>Auction</button>
            <button className="nav-button" onClick={() => navigate('/teams')}>Teams</button>
            <button className="nav-button active">Reports</button>
            <div className="user-info">
              <span className="username">{localStorage.getItem('username')}</span>
              <button className="logout-btn" onClick={handleLogout}>Logout</button>
            </div>
          </nav>
        </div>
      </header>

      {/* Page Header */}
      <div className="reports-page-header">
        <h1 className="page-title">REPORTS & ANALYTICS</h1>
        <p className="page-subtitle">Generate comprehensive reports in PDF and Excel formats</p>
      </div>

      {/* Report Configuration */}
      <div className="report-config-section">
        <div className="report-config-container">
          <div className="config-card">
            <h2>📊 Report Configuration</h2>
            
            <div className="config-group">
              <label>Report Type</label>
              <select 
                value={reportType} 
                onChange={(e) => {
                  setReportType(e.target.value);
                  setSelectedTeam('');
                }}
                className="config-select"
              >
                <option value="all-players">All Players</option>
                <option value="sold-players">Sold Players Only</option>
                <option value="unsold-players">Unsold Players Only</option>
                <option value="available-players">Available Players</option>
                <option value="team-wise">Team-wise Report</option>
              </select>
            </div>

            {reportType === 'team-wise' && (
              <div className="config-group">
                <label>Select Team</label>
                <select 
                  value={selectedTeam} 
                  onChange={(e) => setSelectedTeam(e.target.value)}
                  className="config-select"
                >
                  <option value="">Choose a team</option>
                  {teams.map(team => (
                    <option key={team.id} value={team.team_name}>{team.team_name}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="action-buttons">
              <button 
                className="action-btn pdf-btn"
                onClick={generatePDF}
                disabled={reportType === 'team-wise' && !selectedTeam}
              >
                <span className="btn-icon">📄</span>
                Generate PDF
              </button>
              <button 
                className="action-btn excel-btn"
                onClick={generateExcel}
                disabled={reportType === 'team-wise' && !selectedTeam}
              >
                <span className="btn-icon">📊</span>
                Generate Excel
              </button>
            </div>

            <div className="divider"></div>

            <div className="special-reports">
              <h3>🎯 Special Reports</h3>
              <button 
                className="special-btn"
                onClick={generateAllTeamsExcel}
              >
                <span className="btn-icon">🏆</span>
                All Teams Report (Excel)
              </button>
            </div>
          </div>

          {/* Preview Card */}
          <div className="preview-card">
            <h2>📋 Report Preview</h2>
            <div className="preview-stats">
              <div className="preview-stat">
                <div className="stat-number">{getFilteredPlayers().length}</div>
                <div className="stat-label">Players in Report</div>
              </div>
            </div>

            {loading ? (
              <div className="preview-loading">Loading...</div>
            ) : (
              <div className="preview-list">
                {getFilteredPlayers().slice(0, 5).map((player, index) => (
                  <div key={player.id} className="preview-item">
                    <span className="preview-number">{index + 1}</span>
                    <span className="preview-name">{player.player_name}</span>
                    <span className="preview-age">{player.age} yrs</span>
                    {player.sold_team && (
                      <span 
                        className="preview-team" 
                        style={{ background: getTeamColor(player.sold_team) }}
                      >
                        {player.sold_team}
                      </span>
                    )}
                  </div>
                ))}
                {getFilteredPlayers().length > 5 && (
                  <div className="preview-more">
                    +{getFilteredPlayers().length - 5} more players...
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Teams Summary */}
      <div className="teams-summary-section">
        <div className="teams-summary-container">
          <h2>📈 Teams Summary</h2>
          <div className="teams-summary-grid">
            {teams.map(team => {
              const totalSpent = (Number(team.initial_budget) || 0) - (Number(team.remaining_budget) || 0);
              return (
                <div key={team.id} className="team-summary-card">
                  <div className="team-summary-header" style={{ background: getTeamColor(team.team_name) }}>
                    <h3>{team.team_name}</h3>
                  </div>
                  <div className="team-summary-body">
                    <div className="summary-row">
                      <span>Players:</span>
                      <strong>{team.players?.length || 0}</strong>
                    </div>
                    <div className="summary-row">
                      <span>Spent:</span>
                      <strong>LKR {totalSpent.toLocaleString()}</strong>
                    </div>
                    <div className="summary-row">
                      <span>Remaining:</span>
                      <strong>LKR {(Number(team.remaining_budget) || 0).toLocaleString()}</strong>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;

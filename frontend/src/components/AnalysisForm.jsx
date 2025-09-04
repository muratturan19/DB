import React, { useState, useEffect } from 'react';
import {
  Card,
  Box,
  TextField,
  Button,
  Typography,
  Autocomplete,
  InputAdornment,
  Alert,
  Slider,
  FormControlLabel,
  Checkbox,
  Select,
  MenuItem,
  CircularProgress
} from '@mui/material';
import Table from '@mui/material/Table';
import TableHead from '@mui/material/TableHead';
import TableBody from '@mui/material/TableBody';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import MuiTooltip from '@mui/material/Tooltip';
import PersonIcon from '@mui/icons-material/Person';
import LabelIcon from '@mui/icons-material/Label';
import QrCode2Icon from '@mui/icons-material/QrCode2';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import DescriptionIcon from '@mui/icons-material/Description';
import FishboneDiagram from './FishboneDiagram';
import ReportGuideModal from './ReportGuideModal';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';
import { API_BASE } from '../api';

function prettify(str) {
  return str
    .replace(/_/g, ' ')
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

function formatDate(value) {
  if (typeof value === 'string' && /\d{4}-\d{2}-\d{2}T00:00:00/.test(value)) {
    return value.replace(/T00:00:00.*$/, '');
  }
  return value;
}
const FIELD_MAP = {
  customer: 'Müşteri Adı',
  subject: 'Hata Tanımı - Kök Neden',
  part_code: 'Parça Numarası'
};
const METHODS = ['8D', 'A3', 'Ishikawa', '5N1K', 'DMAIC'];
const GUIDE_TEXT = {
  '8D':
    '8D (Eight Disciplines) metodu, ürün ve süreç kaynaklı problemleri sistematik şekilde çözmek için geliştirilmiş etkili bir problem çözme tekniğidir.',
  A3:
    'A3 Problem Solving, problemi sistematik biçimde tanımlamak, analiz etmek ve çözüm geliştirmek için kullanılan yalın düşünce temelli bir yaklaşımdır.',
  Ishikawa:
    'Ishikawa (Balık Kılçığı) Diyagramı, problemin kök nedenlerini sistematik olarak analiz etmeye yarayan neden-sonuç diyagramıdır.',
  '5N1K':
    '5N1K (5W1H) yöntemi, bir problemi tüm yönleriyle incelemek için kullanılan klasik sorgulama metodudur.',
  DMAIC:
    'DMAIC, süreç iyileştirme için kullanılan sistematik bir problem çözme metodudur.'
};
const FISHBONE_DATA = {
  Problem: {
    Method: [],
    Material: [],
    Machine: [],
    Measurement: [],
    Man: [],
    Environment: []
  }
};
const inputSx = {
  '& .MuiOutlinedInput-root': {
    '&:hover fieldset': { borderColor: 'primary.main' },
    '&.Mui-focused fieldset': { borderColor: 'primary.main' }
  }
};
function AnalysisForm({
  instructionsBoxProps = {},
  methodBoxProps = {},
  filterBoxProps = {},
  initialMethod = ''
}) {
  const [customerOptions, setCustomerOptions] = useState([]);
  const [subjectOptions, setSubjectOptions] = useState([]);
  const [partCodeOptions, setPartCodeOptions] = useState([]);
  const [customer, setCustomer] = useState('');
  const [subject, setSubject] = useState('');
  const [partCode, setPartCode] = useState('');
  const [method, setMethod] = useState(initialMethod);
  const [complaint, setComplaint] = useState('');
  const [directives, setDirectives] = useState('');
  const [useCustomerFilter, setUseCustomerFilter] = useState(false);
  const [usePartCodeFilter, setUsePartCodeFilter] = useState(false);
  const [useSubjectFilter, setUseSubjectFilter] = useState(false);
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => `${currentYear - i}`);
  const [selectedYear, setSelectedYear] = useState('');
  const [claims, setClaims] = useState([]);
  const [claimsError, setClaimsError] = useState('');
  const [error, setError] = useState('');
  const [reviewText, setReviewText] = useState('');
  const [analysisText, setAnalysisText] = useState('');
  const [reportPaths, setReportPaths] = useState(null);
  const [loading, setLoading] = useState(false);
  const [monthRange, setMonthRange] = useState([0, 11]);
  const [yearRange, setYearRange] = useState([2016, 2025]);
  const LANGUAGE_OPTIONS = [
    'Türkçe',
    'İngilizce',
    'İtalyanca',
    'Almanca',
    'Fransızca'
  ];
  const [language, setLanguage] = useState('Türkçe');
  const [guideOpen, setGuideOpen] = useState(false);
  const months = [
    'Oca',
    'Şub',
    'Mar',
    'Nis',
    'May',
    'Haz',
    'Tem',
    'Ağu',
    'Eyl',
    'Eki',
    'Kas',
    'Ara'
  ];
  const monthlyData = months.map((m) => ({
    name: m,
    count: Math.floor(Math.random() * 15) + 5
  }));
  const filteredMonths = monthlyData.slice(monthRange[0], monthRange[1] + 1);
  const yearlyData = Array.from({ length: 10 }, (_, idx) => ({
    name: 2016 + idx,
    count: Math.floor(Math.random() * 200) + 50
  }));
  const filteredYears = yearlyData.filter(
    (d) => d.name >= yearRange[0] && d.name <= yearRange[1]
  );
  useEffect(() => {
    const fetchOptions = async (field, setter) => {
      try {
        const res = await fetch(`${API_BASE}/options/${field}`);
        if (res.ok) {
          const data = await res.json();
          setter(data.values || data || []);
        }
      } catch {
        setter([]);
      }
    };
    fetchOptions('customer', setCustomerOptions);
    fetchOptions('subject', setSubjectOptions);
    fetchOptions('part_code', setPartCodeOptions);
  }, []);

  const extractError = async (res) => {
    const text = await res.text();
    try {
      const data = JSON.parse(text);
      return data.detail || data.message || text;
    } catch {
      return text;
    }
  };
  const handleAnalyze = async () => {
    setError('');
    setLoading(true);
    setAnalysisText('');
    setReviewText('');
    setReportPaths(null);
    const details = {
      complaint,
      customer,
      subject,
      part_code: partCode
    };
    try {
      const guideRes = await fetch(`${API_BASE}/guide/${method}`);
      if (!guideRes.ok) {
        setError(await extractError(guideRes));
        return;
      }
      const guideline = await guideRes.json();

      const analyzeRes = await fetch(`${API_BASE}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ details, guideline, directives, language })
      });
      if (!analyzeRes.ok) {
        setError(await extractError(analyzeRes));
        return;
      }
      const analysis = await analyzeRes.json();
      let text = analysis.full_text || analysis.analysisText;
      if (!text) {
        const steps = Object.values(analysis)
          .map((s) => (s && typeof s === 'object' ? s.response : undefined))
          .filter(Boolean);
        text = steps.join('\n\n');
      }
      if (!text) {
        setError('Sunucudan beklenmeyen boş yanıt alındı');
        return;
      }
      setAnalysisText(text);

      const reviewRes = await fetch(`${API_BASE}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: text || JSON.stringify(analysis),
          context: { language }
        })
      });
      if (!reviewRes.ok) {
        setError(await extractError(reviewRes));
        return;
      }
      const reviewData = await reviewRes.json();
      if (!reviewData?.result) {
        setError('Sunucudan beklenmeyen boş yanıt alındı');
        return;
      }
      setReviewText(reviewData.result);

      const reportRes = await fetch(`${API_BASE}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          analysis,
          complaint_info: details,
          output_dir: '.'
        })
      });

      if (!reportRes.ok) {
        setError(await extractError(reportRes));
        setReportPaths(null);
        return;
      } else {
        const paths = await reportRes.json();

        if (!paths?.pdf) {
          setError('Sunucudan beklenmeyen boş yanıt alındı');
        } else {
          const finalReportPaths = {
            pdf: `${API_BASE}${paths.pdf}`,
            excel: `${API_BASE}${paths.excel}`
          };
          setReportPaths(finalReportPaths);
        }
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };
  const handleFetchClaims = async () => {
    const params = new URLSearchParams();
    if (useCustomerFilter && customer)
      params.append(FIELD_MAP.customer, customer);
    if (useSubjectFilter && subject)
      params.append(FIELD_MAP.subject, subject);
    if (usePartCodeFilter && partCode)
      params.append(FIELD_MAP.part_code, partCode);
    if (selectedYear) params.append('start_year', selectedYear);
    const url =
      params.toString().length > 0
        ? `${API_BASE}/complaints?${params.toString()}`
        : `${API_BASE}/complaints`;
    try {
      setClaimsError('');
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`HTTP error ${res.status}`);
      }
      const data = await res.json();
      const results = data.results || data;
      const records = Array.isArray(results)
        ? results
        : results && typeof results === 'object'
          ? results.store !== undefined || results.excel !== undefined
            ? [...(results.store || []), ...(results.excel || [])]
            : [results]
          : [];
      setClaims(records);
      setClaimsError('');
    } catch (err) {
      console.error(err);
      setClaimsError(err.message || 'Şikayetler alınamadı');
      setClaims([]);
    }
  };

  const handleScan8D = async () => {
    try {
      setError('');
      setLoading(true);
      const res = await fetch(`${API_BASE}/scan_8d`, { method: 'POST' });
      if (!res.ok) {
        setError(await extractError(res));
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };
  return (
    <>
        {/* DEBUG: API'den gelen claims veri setini ve kolonlarını ham olarak ekranda göster */}


    <Card
      sx={{
        maxWidth: '100%',
        margin: '20px auto',
        p: 3,
        display: 'flex',
        flexDirection: 'row',
        boxShadow: 4,
        background: 'linear-gradient(180deg, #fff 0%, #f4f7fb 100%)',
        position: 'relative',
        overflowY: 'auto'
      }}
    >
      {/* Sol Form Alanı */}
      <Box
        sx={{
          width: '68%',
          minWidth: 0,
          height: 'auto',
          display: 'flex',
          flexDirection: 'column',
          pr: 3,
          borderRadius: 2
        }}
      >
        {/* Şikayet ve Müşteri Bilgileri */}
        <Box
          sx={{
            width: '100%',
            display: 'flex',
            flexDirection: 'row',
            gap: 2,
            mb: 4,
            height: 'auto'
          }}
        >
          {/* Şikayet Alanı */}
          <Box sx={{ width: '56%', minWidth: 0, height: '100%' }}>
            <TextField
              label="Şikayet (Complaint)"
              multiline
              minRows={10}
              fullWidth
              value={complaint}
              onChange={(e) => setComplaint(e.target.value)}
              sx={{ height: '100%' }}
            />
          </Box>
          {/* Müşteri/Kod/Metot Alanı */}
          <Box
            sx={{
              width: '44%',
              minWidth: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
              justifyContent: 'flex-start',
              height: '100%',
              ...methodBoxProps
            }}
          >
            <Autocomplete
              fullWidth
              freeSolo
              options={customerOptions}
              inputValue={customer}
              onInputChange={(e, v) => setCustomer(v)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Müşteri Adı"
                  sx={inputSx}
                  inputProps={{
                    ...params.inputProps,
                    'data-testid': 'customer-input',
                    'aria-label': 'customer-input'
                  }}
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonIcon />
                      </InputAdornment>
                    )
                  }}
                />
              )}
            />
            <Autocomplete
              fullWidth
              freeSolo
              options={subjectOptions}
              inputValue={subject}
              onInputChange={(e, v) => setSubject(v)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Konu"
                  sx={inputSx}
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: (
                      <InputAdornment position="start">
                        <LabelIcon />
                      </InputAdornment>
                    )
                  }}
                />
              )}
            />
            <Autocomplete
              fullWidth
              freeSolo
              options={partCodeOptions}
              inputValue={partCode}
              onInputChange={(e, v) => setPartCode(v)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Parça Kodu"
                  sx={inputSx}
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: (
                      <InputAdornment position="start">
                        <QrCode2Icon />
                      </InputAdornment>
                    )
                  }}
                />
              )}
            />
            <Autocomplete
              fullWidth
              options={METHODS}
              value={method}
              onChange={(event, newValue) => setMethod(newValue)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Metot"
                  sx={inputSx}
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: (
                      <InputAdornment position="start">
                        <ArrowDropDownIcon />
                      </InputAdornment>
                    )
                  }}
                />
              )}
            />
            {method === 'Ishikawa' && (
              <Box sx={{ mt: 2 }}>
                <FishboneDiagram data={FISHBONE_DATA} />
              </Box>
            )}
          </Box>
        </Box>
        {/* Özel Talimatlar Alanı */}
        <Box
          sx={{
            width: '100%',
            mt: 2,
            height: { xs: 'auto', md: '38%' },
            minHeight: 90,
            borderRadius: 1,
            p: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-start',
            ...instructionsBoxProps
          }}
        >
          <Typography sx={{ fontWeight: 'bold', mb: 1 }}>Özel Talimatlar</Typography>
          <TextField
            multiline
            minRows={3}
            fullWidth
            value={directives}
            onChange={(e) => setDirectives(e.target.value)}
            sx={{ height: '100%' }}
          />
        </Box>
        {/* Filtreler */}
        <Box
          sx={{
            width: '100%',
            display: 'flex',
            mt: 1,
            gap: 2,
            flexWrap: 'wrap',
            alignItems: 'center',
            mb: 1,
            ...filterBoxProps
          }}
        >
          <FormControlLabel
            control={
              <Checkbox
                checked={useCustomerFilter}
                onChange={(e) => setUseCustomerFilter(e.target.checked)}
              />
            }
            label="Müşteri"
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={usePartCodeFilter}
                onChange={(e) => setUsePartCodeFilter(e.target.checked)}
              />
            }
            label="Parça Kodu"
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={useSubjectFilter}
                onChange={(e) => setUseSubjectFilter(e.target.checked)}
              />
            }
            label="Konu"
          />
          <Select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            displayEmpty
            size="small"
            sx={{ minWidth: 80 }}
          >
            <MenuItem value="">
              <em>Yıl</em>
            </MenuItem>
            {years.map((y) => (
              <MenuItem key={y} value={y}>
                {y}
              </MenuItem>
            ))}
          </Select>
        </Box>
        {/* Buton Alanı */}
        <Box
          sx={{
            width: '100%',
            display: 'flex',
            gap: 2,
            mt: 1,
            mb: 2,
            alignItems: 'center'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
            <Typography sx={{ mr: 1 }}>Dil seçimi</Typography>
            <Select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              size="small"
              sx={{ minWidth: 120 }}
            >
              {LANGUAGE_OPTIONS.map((opt) => (
                <MenuItem key={opt} value={opt}>
                  {opt}
                </MenuItem>
              ))}
            </Select>
          </Box>
          <Button
            variant="outlined"
            color="secondary"
            onClick={() => setGuideOpen(true)}
          >
            Rapor Kılavuzu
          </Button>
          <Button variant="contained" color="primary" onClick={handleAnalyze}>
            ANALİZ ET
          </Button>
          <Button variant="outlined" color="primary" onClick={handleFetchClaims}>
            Şikayetleri Getir
          </Button>
          <Button variant="outlined" color="primary" onClick={handleScan8D}>
            8D raporlarını tara
          </Button>
        </Box>
        {method && (
          <Alert severity="info" sx={{ mt: 1, mb: 2, fontSize: 15 }}>
            {GUIDE_TEXT[method]}
          </Alert>
        )}
        {claimsError && (
          <Alert severity="error" sx={{ mt: 1 }}>
            {claimsError}
          </Alert>
        )}
        {claims && claims.length > 0 && (
          <Box
            sx={{ mt: 2, minHeight: 150, maxHeight: 400, overflowY: 'auto' }}
          >
            <Table
              size="small"
              stickyHeader
              sx={{
                mt: 0,
                backgroundColor: '#fff',
                border: '1px solid #ccc',
                minWidth: 650,
                width: '100%',
                tableLayout: 'auto'
              }}
            >
              <TableHead>
                <TableRow>
                  {Object.keys(claims[0]).map((col) => (
                    <TableCell key={col}>
                      <MuiTooltip title={col} placement="top">
                        <span
                          style={{
                            maxWidth: 120,
                            display: 'inline-block',
                            
                          }}
                        >
                          {prettify(col)}
                        </span>
                      </MuiTooltip>
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {claims.map((c, i) => (
                  <TableRow key={i}>
                    {Object.keys(claims[0]).map((col) => (
                      <TableCell key={col}>
                        {formatDate(c[col])}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        )}
        {claims && claims.length === 0 && (
          <Typography sx={{ mt: 2 }}>Kayıt bulunamadı</Typography>
        )}
        {loading && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(255,255,255,0.6)',
              zIndex: 2
            }}
          >
            <CircularProgress data-testid="loading-indicator" />
          </Box>
        )}
        {error && (
          <Alert severity="error" sx={{ mt: 1 }}>
            {error}
          </Alert>
        )}
        {analysisText && !reviewText && (
          <Box sx={{ mt: 2 }}>
            <Card variant="outlined" sx={{ p: 2, backgroundColor: '#f9f9f9' }}>
              <Typography data-testid="analysis-text" sx={{ whiteSpace: 'pre-line' }}>
                {analysisText}
              </Typography>
            </Card>
          </Box>
        )}
        {reviewText && (
          <Box sx={{ mt: 2 }}>
            <Card variant="outlined" sx={{ p: 2, backgroundColor: '#f9f9f9' }}>
              <Typography data-testid="review-text" sx={{ whiteSpace: 'pre-line' }}>
                {reviewText}
              </Typography>

              {reportPaths && (
                <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
                  <Button
                    variant="contained"
                    color="primary"
                    href={reportPaths.pdf}
                    target="_blank"
                    rel="noopener noreferrer"
                    download
                    startIcon={<PictureAsPdfIcon />}
                  >
                    PDF indir
                  </Button>
                  <Button
                    variant="contained"
                    color="success"
                    href={reportPaths.excel}
                    target="_blank"
                    rel="noopener noreferrer"
                    download
                    startIcon={<DescriptionIcon />}
                  >
                    Excel indir
                  </Button>
                </Box>
              )}
            </Card>
          </Box>
        )}
      </Box>
      {/* Grafikler Alanı */}
      <Box
        sx={{
          width: '32%',
          minWidth: 0,
          height: 540,
          display: 'flex',
          flexDirection: 'column',
          gap: 3,
          alignItems: 'stretch',
          pl: 3,
          borderRadius: 2
        }}
      >
        <Box
          sx={{
            width: '100%',
            height: '49%',
            borderRadius: 2,
            mb: 1,
            p: 2,
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <Typography variant="h6" gutterBottom>
            2025 Aylık Şikayet
          </Typography>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={filteredMonths}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#2196f3" />
            </BarChart>
          </ResponsiveContainer>
          <Slider
            value={monthRange}
            min={0}
            max={11}
            step={1}
            marks={[
              { value: 0, label: 'Oca' },
              { value: 11, label: 'Ara' }
            ]}
            valueLabelDisplay="auto"
            onChange={(_, v) => setMonthRange(v)}
          />
        </Box>
        <Box
          sx={{
            width: '100%',
            height: '49%',
            borderRadius: 2,
            p: 2,
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <Typography variant="h6" gutterBottom>
            Son 10 Yıl Şikayet
          </Typography>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={filteredYears}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#90caf9" />
            </BarChart>
          </ResponsiveContainer>
          <Slider
            value={yearRange}
            min={2016}
            max={2025}
            step={1}
            marks={[
              { value: 2016, label: 2016 },
              { value: 2025, label: 2025 }
            ]}
            valueLabelDisplay="auto"
            onChange={(_, v) => setYearRange(v)}
          />
        </Box>
      </Box>
    </Card>
    <ReportGuideModal open={guideOpen} onClose={() => setGuideOpen(false)} />
    </>
  );
}
export default AnalysisForm;

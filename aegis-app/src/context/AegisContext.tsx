import React, { createContext, useContext, useEffect, useState } from 'react';
import { Finding, Brand, Scan, Severity, FindingStatus } from '../types';
import { INITIAL_BRANDS, INITIAL_FINDINGS, INITIAL_SCANS } from '../data/mockData';
import { api } from '../services/apiService';

interface AegisContextType {
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  isAuthenticated: boolean;
  currentUser: { name: string; email: string } | null;
  setCurrentUser: (user: { name: string; email: string } | null) => void;
  logout: () => void;
  brands: Brand[];
  findings: Finding[];
  scans: Scan[];
  selectedFinding: Finding | null;
  setSelectedFinding: (f: Finding | null) => void;
  isScanWizardOpen: boolean;
  setIsScanWizardOpen: (open: boolean) => void;
  runNewScan: (brandId: string, targets: string[], scanType: string) => Promise<void>;
  updateFindingStatus: (id: string, status: FindingStatus) => void;
  addBrand: (brand: Partial<Brand>) => void;
  deleteBrand: (id: string) => void;
  updateBrand: (id: string, updates: Partial<Brand>) => void;
  retryScan: (scanId: string) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
}

const AegisContext = createContext<AegisContextType | undefined>(undefined);

export const AegisProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<{ name: string; email: string } | null>(() => {
    const saved = localStorage.getItem('aegis-current-user');
    return saved ? JSON.parse(saved) : null;
  });

  const isAuthenticated = Boolean(currentUser);

  const handleSetCurrentUser = (user: { name: string; email: string } | null) => {
    setCurrentUser(user);
    if (user) {
      localStorage.setItem('aegis-current-user', JSON.stringify(user));
      localStorage.setItem('aegis-authenticated', 'true');
    } else {
      localStorage.removeItem('aegis-current-user');
      localStorage.removeItem('aegis-authenticated');
      localStorage.removeItem('aegis-auth-token');
    }
  };

  const logout = () => {
    api.auth.logout().catch(() => {});
    handleSetCurrentUser(null);
  };

  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('aegis-theme');
    return (saved as 'dark' | 'light') || 'dark';
  });

  const [brands, setBrands] = useState<Brand[]>(() => {
    const saved = localStorage.getItem('aegis-brands');
    return saved ? JSON.parse(saved) : INITIAL_BRANDS;
  });

  const [findings, setFindings] = useState<Finding[]>(() => {
    const saved = localStorage.getItem('aegis-findings');
    return saved ? JSON.parse(saved) : INITIAL_FINDINGS;
  });

  const [scans, setScans] = useState<Scan[]>(() => {
    const saved = localStorage.getItem('aegis-scans');
    return saved ? JSON.parse(saved) : INITIAL_SCANS;
  });

  const [selectedFinding, setSelectedFinding] = useState<Finding | null>(null);
  const [isScanWizardOpen, setIsScanWizardOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Automatic Backend Synchronization on mount
  useEffect(() => {
    let isMounted = true;
    const syncBackendData = async () => {
      try {
        const [bRes, fRes, sRes] = await Promise.all([
          api.brands.getAll(),
          api.findings.getAll(),
          api.scans.getAll()
        ]);
        if (isMounted) {
          if (bRes.data && Array.isArray(bRes.data) && bRes.data.length > 0) {
            setBrands(bRes.data);
          }
          if (fRes.data && Array.isArray(fRes.data) && fRes.data.length > 0) {
            setFindings(fRes.data);
          }
          if (sRes.data && Array.isArray(sRes.data) && sRes.data.length > 0) {
            setScans(sRes.data);
          }
        }
      } catch {
        // Fallback silently to localStorage / mock data
      }
    };
    syncBackendData();
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    localStorage.setItem('aegis-theme', theme);
    if (theme === 'light') {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.remove('light');
      document.documentElement.classList.add('dark');
    }
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('aegis-brands', JSON.stringify(brands));
  }, [brands]);

  useEffect(() => {
    localStorage.setItem('aegis-findings', JSON.stringify(findings));
  }, [findings]);

  useEffect(() => {
    localStorage.setItem('aegis-scans', JSON.stringify(scans));
  }, [scans]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const updateFindingStatus = (id: string, status: FindingStatus) => {
    api.findings.updateStatus(id, status).catch(() => {});
    setFindings(prev =>
      prev.map(f => (f.id === id ? { ...f, status } : f))
    );
    if (selectedFinding && selectedFinding.id === id) {
      setSelectedFinding(prev => (prev ? { ...prev, status } : null));
    }
  };

  const addBrand = (newB: Partial<Brand>) => {
    const brand: Brand = {
      id: `brand-${Date.now()}`,
      name: newB.name || 'New Monitored Brand',
      domain: newB.domain || 'example.com',
      logo: (newB.name || 'B').charAt(0).toUpperCase(),
      status: 'active',
      monitoredAssets: 12,
      riskScore: 35,
      lastScanTime: 'Just now',
      activeFindingsCount: 1,
      description: newB.description || 'Newly monitored organizational brand asset.',
      socialHandles: newB.socialHandles || [],
      protectedKeywords: newB.protectedKeywords || [newB.name?.toLowerCase() || 'asset']
    };
    api.brands.create(brand).catch(() => {});
    setBrands(prev => [brand, ...prev]);
  };

  const deleteBrand = (id: string) => {
    api.brands.delete(id).catch(() => {});
    setBrands(prev => prev.filter(b => b.id !== id));
  };

  const updateBrand = (id: string, updates: Partial<Brand>) => {
    api.brands.update(id, updates).catch(() => {});
    setBrands(prev => prev.map(b => (b.id === id ? { ...b, ...updates } : b)));
  };

  const runNewScan = async (brandId: string, targets: string[], scanType: string) => {
    const brand = brands.find(b => b.id === brandId) || brands[0];
    const newScanId = `scan-${Date.now()}`;
    const newScan: Scan = {
      id: newScanId,
      brandName: brand.name,
      brandId: brand.id,
      status: 'running',
      progress: 15,
      findingsCount: 0,
      highPriorityCount: 0,
      timeAgo: 'Just now',
      timestamp: Date.now(),
      targetCount: targets.length * 120 + 350,
      scanType: (scanType as any) || 'comprehensive'
    };

    setScans(prev => [newScan, ...prev]);
    api.scans.run(brandId, targets, scanType).catch(() => {});

    // Simulate scan progression
    setTimeout(() => {
      setScans(prev =>
        prev.map(s => (s.id === newScanId ? { ...s, progress: 65, findingsCount: 4 } : s))
      );
    }, 1500);

    setTimeout(() => {
      const generatedFinding: Finding = {
        id: `find-${Date.now()}`,
        type: targets.includes('social') ? 'social' : 'domain',
        title: targets.includes('social')
          ? `@${brand.name.toLowerCase().replace(/[^a-z0-9]/g, '')}_rewards_official`
          : `${brand.name.toLowerCase().replace(/[^a-z0-9]/g, '')}-login-verify.site`,
        targetUrl: targets.includes('social')
          ? `https://instagram.com/${brand.name.toLowerCase().replace(/[^a-z0-9]/g, '')}_rewards_official`
          : `https://${brand.name.toLowerCase().replace(/[^a-z0-9]/g, '')}-login-verify.site`,
        associatedBrand: brand.name,
        brandId: brand.id,
        risk: 'high',
        similarity: 91,
        status: 'new',
        detectedTime: 'Just now',
        detectedTimestamp: Date.now(),
        platform: targets.includes('social') ? 'instagram' : 'web',
        dnsHost: 'cloudflare-gateway.protection.net',
        ipAddress: '104.21.55.91',
        registrar: 'Dynadot LLC',
        asn: 'AS13335 Cloudflare',
        assignedAnalyst: 'Alex Carter',
        notes: [
          `Simulated discovery from newly launched ${scanType} scan.`,
          'Pattern similarity match against primary trademark keywords.'
        ]
      };

      setFindings(prev => [generatedFinding, ...prev]);

      setScans(prev =>
        prev.map(s =>
          s.id === newScanId
            ? { ...s, status: 'completed', progress: 100, findingsCount: 6, highPriorityCount: 2 }
            : s
        )
      );
    }, 3200);
  };

  const retryScan = (scanId: string) => {
    api.scans.retry(scanId).catch(() => {});
    setScans(prev =>
      prev.map(s =>
        s.id === scanId
          ? { ...s, status: 'running', progress: 20, errorMessage: undefined, timeAgo: 'Retrying...' }
          : s
      )
    );
    setTimeout(() => {
      setScans(prev =>
        prev.map(s =>
          s.id === scanId
            ? { ...s, status: 'completed', progress: 100, findingsCount: 8, timeAgo: 'Just now' }
            : s
        )
      );
    }, 2000);
  };

  return (
    <AegisContext.Provider
      value={{
        theme,
        toggleTheme,
        isAuthenticated,
        currentUser,
        setCurrentUser: handleSetCurrentUser,
        logout,
        brands,
        findings,
        scans,
        selectedFinding,
        setSelectedFinding,
        isScanWizardOpen,
        setIsScanWizardOpen,
        runNewScan,
        updateFindingStatus,
        addBrand,
        deleteBrand,
        updateBrand,
        retryScan,
        searchQuery,
        setSearchQuery
      }}
    >
      {children}
    </AegisContext.Provider>
  );
};

export const useAegis = () => {
  const context = useContext(AegisContext);
  if (!context) {
    throw new Error('useAegis must be used within an AegisProvider');
  }
  return context;
};

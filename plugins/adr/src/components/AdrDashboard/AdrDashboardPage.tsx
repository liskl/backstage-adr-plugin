import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Content,
  ContentHeader,
  Header,
  HeaderLabel,
  Page,
  SupportButton,
} from '@backstage/core-components';
import { useApi } from '@backstage/core-plugin-api';
import {
  Box,
  Button,
  Grid,
  Tab,
  Tabs,
  Card,
  CardContent,
  Typography,
  makeStyles,
} from '@material-ui/core';
import Add from '@material-ui/icons/Add';
import DashboardIcon from '@material-ui/icons/Dashboard';
import ListIcon from '@material-ui/icons/List';
import { AdrFilters, SavedFilterPreset } from '@backstage-community/plugin-adr-common';
import { adrApiRef } from '../../api';
import { AdrList } from '../AdrList';
import { AdrFilterBar } from '../AdrFilterBar';
import { AdrStatsCards } from './AdrStatsCards';
import { AdrPendingPrsList } from '../AdrActions';
import { useAsync } from 'react-use';

const useStyles = makeStyles(theme => ({
  tabContent: {
    marginTop: theme.spacing(2),
  },
}));

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`adr-tabpanel-${index}`}
      aria-labelledby={`adr-tab-${index}`}
      {...other}
    >
      {value === index && <Box>{children}</Box>}
    </div>
  );
}

/**
 * Main dashboard page for ADRs
 */
export const AdrDashboardPage = () => {
  const classes = useStyles();
  const navigate = useNavigate();
  const adrApi = useApi(adrApiRef);
  const [tabValue, setTabValue] = useState(0);

  const { value: stats, loading: statsLoading } = useAsync(
    () => adrApi.getStats(),
    [adrApi],
  );

  const { value: pendingPrs, loading: prsLoading, error: prsError } = useAsync(
    () => adrApi.getPendingPrs(),
    [adrApi],
  );

  const handleTabChange = (_event: React.ChangeEvent<{}>, newValue: number) => {
    setTabValue(newValue);
  };

  const handleCreateAdr = () => {
    navigate('/adr/create');
  };

  return (
    <Page themeId="tool">
      <Header title="Architecture Decision Records">
        <HeaderLabel label="Total ADRs" value={stats?.totalCount?.toString() || '—'} />
        <HeaderLabel
          label="Accepted"
          value={stats?.byStatus?.accepted?.toString() || '—'}
        />
        <HeaderLabel
          label="Pending Review"
          value={stats?.pendingReview?.length?.toString() || '—'}
        />
      </Header>
      <Content>
        <ContentHeader title="Decision Records">
          <Button
            variant="contained"
            color="primary"
            startIcon={<Add />}
            onClick={handleCreateAdr}
          >
            Create ADR
          </Button>
          <SupportButton>
            Architecture Decision Records help teams document and track
            important technical decisions.
          </SupportButton>
        </ContentHeader>

        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
        >
          <Tab icon={<DashboardIcon />} label="Dashboard" />
          <Tab icon={<ListIcon />} label="All ADRs" />
        </Tabs>

        <div className={classes.tabContent}>
          <TabPanel value={tabValue} index={0}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <AdrStatsCards stats={stats} loading={statsLoading} />
              </Grid>

              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Recently Updated
                    </Typography>
                    {stats?.recentlyUpdated && stats.recentlyUpdated.length > 0 ? (
                      <AdrList
                        adrs={stats.recentlyUpdated}
                        compact
                      />
                    ) : (
                      <Typography color="textSecondary">
                        No ADRs found
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Pending Review
                    </Typography>
                    {stats?.pendingReview && stats.pendingReview.length > 0 ? (
                      <AdrList
                        adrs={stats.pendingReview}
                        compact
                      />
                    ) : (
                      <Typography color="textSecondary">
                        No ADRs pending review
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12}>
                <AdrPendingPrsList
                  prs={pendingPrs}
                  loading={prsLoading}
                  error={prsError?.message}
                />
              </Grid>
            </Grid>
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            {/* eslint-disable-next-line @typescript-eslint/no-use-before-define */}
            <AdrListWithFilters />
          </TabPanel>
        </div>
      </Content>
    </Page>
  );
};

// Local storage key for saved filter presets
const SAVED_PRESETS_KEY = 'adr-filter-presets';

/**
 * Load saved filter presets from local storage
 */
const loadSavedPresets = (): SavedFilterPreset[] => {
  try {
    const saved = localStorage.getItem(SAVED_PRESETS_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
};

/**
 * Save filter presets to local storage
 */
const saveSavedPresets = (presets: SavedFilterPreset[]): void => {
  try {
    localStorage.setItem(SAVED_PRESETS_KEY, JSON.stringify(presets));
  } catch {
    // Ignore storage errors
  }
};

/**
 * ADR list with search and filter capabilities
 */
const AdrListWithFilters = () => {
  const adrApi = useApi(adrApiRef);
  const [filters, setFilters] = useState<AdrFilters>({});
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [savedPresets, setSavedPresets] = useState<SavedFilterPreset[]>(loadSavedPresets);

  // Fetch filter options
  const { value: authors } = useAsync(() => adrApi.getAuthors(), [adrApi]);
  const { value: repositories } = useAsync(() => adrApi.getRepositories(), [adrApi]);
  const { value: categories } = useAsync(() => adrApi.getCategories(), [adrApi]);

  const { value: result, loading, error } = useAsync(async () => {
    return adrApi.listAdrs(
      filters,
      {
        limit: pageSize,
        offset: page * pageSize,
      },
    );
  }, [adrApi, filters, page, pageSize]);

  const handleFiltersChange = useCallback((newFilters: AdrFilters) => {
    setFilters(newFilters);
    setPage(0); // Reset to first page when filters change
  }, []);

  const handleSavePreset = useCallback((name: string, presetFilters: AdrFilters) => {
    const newPreset: SavedFilterPreset = {
      id: `preset-${Date.now()}`,
      name,
      filters: presetFilters,
      createdAt: new Date().toISOString(),
    };
    const newPresets = [...savedPresets, newPreset];
    setSavedPresets(newPresets);
    saveSavedPresets(newPresets);
  }, [savedPresets]);

  const handleDeletePreset = useCallback((id: string) => {
    const newPresets = savedPresets.filter(p => p.id !== id);
    setSavedPresets(newPresets);
    saveSavedPresets(newPresets);
  }, [savedPresets]);

  return (
    <Box>
      <AdrFilterBar
        filters={filters}
        onFiltersChange={handleFiltersChange}
        availableAuthors={authors || []}
        availableRepositories={repositories || []}
        availableCategories={categories || []}
        savedPresets={savedPresets}
        onSavePreset={handleSavePreset}
        onDeletePreset={handleDeletePreset}
      />
      <AdrList
        adrs={result?.items || []}
        totalCount={result?.totalCount || 0}
        loading={loading}
        error={error}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
      />
    </Box>
  );
};

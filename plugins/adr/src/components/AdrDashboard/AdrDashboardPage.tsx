import React, { useState } from 'react';
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
  Grid,
  Tab,
  Tabs,
  Card,
  CardContent,
  Typography,
  makeStyles,
} from '@material-ui/core';
import DashboardIcon from '@material-ui/icons/Dashboard';
import ListIcon from '@material-ui/icons/List';
import { adrApiRef } from '../../api';
import { AdrList } from '../AdrList';
import { AdrStatsCards } from './AdrStatsCards';
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
  const adrApi = useApi(adrApiRef);
  const [tabValue, setTabValue] = useState(0);

  const { value: stats, loading: statsLoading } = useAsync(
    () => adrApi.getStats(),
    [adrApi],
  );

  const handleTabChange = (_event: React.ChangeEvent<{}>, newValue: number) => {
    setTabValue(newValue);
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
            </Grid>
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <AdrListWithFilters />
          </TabPanel>
        </div>
      </Content>
    </Page>
  );
};

/**
 * ADR list with search and filter capabilities
 */
const AdrListWithFilters = () => {
  const adrApi = useApi(adrApiRef);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);

  const { value: result, loading, error } = useAsync(async () => {
    return adrApi.listAdrs(
      {
        search: searchQuery || undefined,
        status: statusFilter.length > 0 ? statusFilter as any : undefined,
      },
      {
        limit: pageSize,
        offset: page * pageSize,
      },
    );
  }, [adrApi, searchQuery, statusFilter, page, pageSize]);

  return (
    <AdrList
      adrs={result?.items || []}
      totalCount={result?.totalCount || 0}
      loading={loading}
      error={error}
      page={page}
      pageSize={pageSize}
      onPageChange={setPage}
      onPageSizeChange={setPageSize}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      statusFilter={statusFilter}
      onStatusFilterChange={setStatusFilter}
    />
  );
};

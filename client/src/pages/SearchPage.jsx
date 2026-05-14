import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import SearchBar from '../components/search/SearchBar';
import SearchResults from '../components/search/SearchResults';
import RecentSearches from '../components/search/RecentSearches';
import SearchFilters from '../components/search/SearchFilters';
import { useResponsive } from '../hooks/useResponsive';
import { fetchSearchResults } from '../services/searchService';
import styles from './SearchPage.module.css';

const RECENT_STORAGE_KEY = 'instagram_recent_searches';
const CACHE_LIMIT = 25;
const RECENT_DISPLAY_LIMIT = 5;
const RECENT_STORAGE_LIMIT = 10;
const CATEGORY_OPTIONS = ['IGTV', 'Shop', 'Style', 'Decor', 'Beauty'];

function createRecentEntry(term) {
  return {
    id: `term:${term.toLowerCase()}`,
    type: 'term',
    label: term,
    secondaryText: 'Recent search'
  };
}

export default function SearchPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isMobile, isTablet } = useResponsive();

  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState('top');
  const [activeCategory, setActiveCategory] = useState('');
  const [results, setResults] = useState({ users: [], hashtags: [], posts: [], audio: [], hasMore: false });
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  const [error, setError] = useState('');

  const debounceRef = useRef(null);
  const cacheRef = useRef(new Map());
  const pageRef = useRef(1);
  const resultsRef = useRef(results);
  const queryParam = searchParams.get('q') || searchParams.get('query') || '';

  const effectiveQuery = query.trim() || activeCategory;
  const visibleRecent = recentSearches.slice(0, RECENT_DISPLAY_LIMIT);
  const showSidebar = !isMobile;

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(RECENT_STORAGE_KEY) || '[]');
      if (Array.isArray(stored)) setRecentSearches(stored);
    } catch (storageError) {
      console.error('Failed to read recent searches:', storageError);
    }
  }, []);

  useEffect(() => {
    resultsRef.current = results;
  }, [results]);

  useEffect(() => {
    if (queryParam && queryParam !== query) {
      setQuery(queryParam);
      setActiveCategory('');
    }
  }, [queryParam]);

  const writeRecentSearches = useCallback((next) => {
    setRecentSearches(next);
    localStorage.setItem(RECENT_STORAGE_KEY, JSON.stringify(next));
  }, []);

  const saveRecentSearch = useCallback((entry) => {
    if (!entry?.label?.trim()) return;

    setRecentSearches((prev) => {
      const deduped = prev.filter((item) => item.label.toLowerCase() !== entry.label.toLowerCase());
      const next = [entry, ...deduped].slice(0, RECENT_STORAGE_LIMIT);
      localStorage.setItem(RECENT_STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const clearRecentSearches = useCallback(() => {
    writeRecentSearches([]);
  }, [writeRecentSearches]);

  const removeRecentSearch = useCallback((entryId) => {
    writeRecentSearches(recentSearches.filter((item) => item.id !== entryId));
  }, [recentSearches, writeRecentSearches]);

  const rememberRecentEntry = useCallback((entry) => {
    setRecentSearches((prev) => {
      const deduped = prev.filter((item) => item.label.toLowerCase() !== entry.label.toLowerCase());
      const next = [entry, ...deduped].slice(0, RECENT_STORAGE_LIMIT);
      localStorage.setItem(RECENT_STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const persistCache = (key, value) => {
    const nextCache = new Map(cacheRef.current);
    nextCache.set(key, value);

    if (nextCache.size > CACHE_LIMIT) {
      const oldestKey = nextCache.keys().next().value;
      nextCache.delete(oldestKey);
    }

    cacheRef.current = nextCache;
  };

  const loadResults = useCallback(async ({
    queryValue = effectiveQuery,
    tab = activeTab,
    page = 1,
    append = false
  } = {}) => {
    const normalizedQuery = queryValue.trim();
    const cacheKey = `${tab}:${normalizedQuery || '__suggested__'}:${page}`;

    if (!append && cacheRef.current.has(cacheKey)) {
      const cached = cacheRef.current.get(cacheKey);
      setResults(cached);
      pageRef.current = page;
      return;
    }

    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
      setError('');
    }

    try {
      const data = await fetchSearchResults({
        q: normalizedQuery,
        type: tab,
        page
      });

      const nextResults = append
        ? {
            ...data,
            posts: [...resultsRef.current.posts, ...data.posts]
          }
        : data;

      setResults(nextResults);
      persistCache(cacheKey, nextResults);
      pageRef.current = page;

      if (!append && normalizedQuery) {
        saveRecentSearch(createRecentEntry(normalizedQuery));
      }
    } catch (requestError) {
      console.error('Search failed:', requestError);
      setError('Unable to load search results right now.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [activeTab, effectiveQuery, saveRecentSearch]);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      loadResults({ queryValue: effectiveQuery, tab: activeTab, page: 1 });
    }, 300);

    return () => clearTimeout(debounceRef.current);
  }, [effectiveQuery, activeTab, loadResults]);

  const handleSearchChange = (value) => {
    setQuery(value);
    if (value.trim()) {
      setActiveCategory('');
    }
    if (value.trim()) {
      setSearchParams({ q: value.trim() }, { replace: true });
    } else {
      setSearchParams({}, { replace: true });
    }
  };

  const handleSelectCategory = (category) => {
    setActiveCategory(category === activeCategory ? '' : category);
    setQuery('');
    setActiveTab('top');
    setSearchParams(category === activeCategory ? {} : { q: category }, { replace: true });
  };

  const handleSelectRecent = (entry) => {
    setQuery(entry.label);
    setActiveCategory('');
    setActiveTab(entry.type === 'hashtag' ? 'tags' : entry.type === 'account' ? 'accounts' : 'top');
    setSearchParams({ q: entry.label }, { replace: true });
  };

  const handleSelectResult = (entry) => {
    rememberRecentEntry(entry);
  };

  const handleLoadMore = () => {
    if (loadingMore || loading || !results.hasMore) return;
    loadResults({ queryValue: effectiveQuery, tab: activeTab, page: pageRef.current + 1, append: true });
  };

  const resultContext = useMemo(() => ({
    query: effectiveQuery,
    activeTab,
    isMobile,
    isTablet,
    isDiscoverMode: !effectiveQuery
  }), [activeTab, effectiveQuery, isMobile, isTablet]);

  return (
    <main className={styles.page}>
      <div className={styles.searchLayout}>
        {showSidebar && (
          <aside className={styles.sidebar}>
            <div className={styles.sidebarCard}>
              <div className={styles.sidebarHeader}>
                <h1>Search</h1>
              </div>

              <SearchBar
                value={query}
                onChange={handleSearchChange}
                placeholder="Search"
              />

              <RecentSearches
                items={visibleRecent}
                onClear={clearRecentSearches}
                onRemove={removeRecentSearch}
                onSelect={handleSelectRecent}
                compact
              />

              <SearchFilters
                options={CATEGORY_OPTIONS}
                activeValue={activeCategory}
                onSelect={handleSelectCategory}
              />
            </div>
          </aside>
        )}

        <section className={styles.content}>
          {isMobile && (
            <div className={styles.mobileHeader}>
              <button type="button" className={styles.backButton} onClick={() => navigate(-1)}>
                ←
              </button>
              <SearchBar
                value={query}
                onChange={handleSearchChange}
                placeholder="Search users, hashtags, or places..."
                autoFocus
              />
            </div>
          )}

          {isMobile && !effectiveQuery && (
            <>
              <RecentSearches
                items={visibleRecent}
                onClear={clearRecentSearches}
                onRemove={removeRecentSearch}
                onSelect={handleSelectRecent}
              />

              <SearchFilters
                title="Categories"
                options={CATEGORY_OPTIONS}
                activeValue={activeCategory}
                onSelect={handleSelectCategory}
                mobile
              />
            </>
          )}

          <SearchResults
            results={results}
            loading={loading}
            loadingMore={loadingMore}
            error={error}
            context={resultContext}
            onTabChange={setActiveTab}
            onSelectResult={handleSelectResult}
            onLoadMore={handleLoadMore}
          />
        </section>
      </div>
    </main>
  );
}

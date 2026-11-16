import type { Metadata } from 'next'
import { AdvancedSearchView } from '@/components/search/advanced-search-view'

export const metadata: Metadata = { title: 'Advanced Search' }

export default function SearchPage() {
  return <AdvancedSearchView />
}

from ddgs import DDGS

ALLOWED_DOMAINS = [
    "gov.in",
    "kerala.gov.in",
    "scholarships.gov.in",
    "mygov.in",
    "india.gov.in",
    "cdc.kerala.gov.in",
    "dcescholarship.kerala.gov.in"
]       

def build_queries(user):
    """
    Generate multiple focused queries instead of one broad query
    """
    return [
        f"{user['state']} student scholarship government",
        f"{user['state']} {user['category']} scholarship government",
        f"Central sector scholarship income government",
        f"{user['state']} higher education scholarship official"
    ]

def duckduckgo_scheme_search(user, max_results_per_query=10):
    queries = build_queries(user)
    aggregated = {}
    
    with DDGS() as ddgs:
        for query in queries:
            for r in ddgs.text(query, max_results=max_results_per_query):
                url = r.get("href", "")
                
                if not url:
                    continue

                if not any(domain in url for domain in ALLOWED_DOMAINS):
                    continue

                # Deduplicate by URL
                if url not in aggregated:
                    aggregated[url] = {
                        "title": r.get("title", ""),
                        "url": url,
                        "snippet": r.get("body", ""),
                        "source_query": query
                    }

    return list(aggregated.values())

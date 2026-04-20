package com.fypals.FYPals.search;

import com.fypals.FYPals.search.dto.SearchResultDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/search")
@RequiredArgsConstructor
public class SearchController {

    private final SearchService searchService;

    @GetMapping
    public ResponseEntity<List<SearchResultDTO>> search(
            @RequestParam String q,
            @RequestParam(required = false) String type) {
        return ResponseEntity.ok(searchService.search(q, type));
    }
}
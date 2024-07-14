"use client";

import {
  useState,
  useRef,
  ChangeEvent,
  KeyboardEvent,
  FC,
  useEffect,
} from "react";
import { useQuery } from "@tanstack/react-query";
import { useFormulaStore } from "@/app/store";

type Suggestions = {
  name: string;
  category: string;
  value: number;
  id: string;
};

const fetchSuggestions = async (): Promise<Suggestions[]> => {
  const res = await fetch(
    `https://652f91320b8d8ddac0b2b62b.mockapi.io/autocomplete?query=`
  );
  return res.json();
};

const FormulaInput: FC = () => {
  const { formula, addTag, removeTag, updateTag } = useFormulaStore();
  const [query, setQuery] = useState<string>("");
  const [filteredSuggestions, setFilteredSuggestions] = useState<Suggestions[]>(
    []
  );
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const [calculation, setCalculation] = useState<string>("");
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionRefs = useRef<(HTMLLIElement | null)[]>([]);

  const { data: suggestions, refetch } = useQuery({
    queryKey: ["autocomplete"],
    queryFn: fetchSuggestions,
  });

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    if (value.trim() && suggestions) {
      const filtered = suggestions.filter((suggestion) =>
        suggestion.name.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredSuggestions(filtered);
      setHighlightedIndex(-1);
    } else {
      setFilteredSuggestions([]);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    const operands = ["+", "-", "*", "/", "(", ")", "^"];
    if (e.key === "ArrowDown") {
      setHighlightedIndex((prevIndex) =>
        prevIndex < filteredSuggestions.length - 1 ? prevIndex + 1 : prevIndex
      );
    } else if (e.key === "ArrowUp") {
      setHighlightedIndex((prevIndex) =>
        prevIndex > 0 ? prevIndex - 1 : prevIndex
      );
    } else if (e.key === "Enter") {
      if (
        highlightedIndex >= 0 &&
        highlightedIndex < filteredSuggestions.length
      ) {
        const selectedSuggestion = filteredSuggestions[highlightedIndex];
        if (calculation === "" || operands.includes(calculation.slice(-1))) {
          addTag(selectedSuggestion.name);
          setCalculation((prev) => prev + selectedSuggestion.value.toString());
          setQuery("");
          setFilteredSuggestions([]);
          setHighlightedIndex(-1);
        }
      } else if (
        query.trim() &&
        suggestions?.some((s) => s.name.toLowerCase() === query.toLowerCase())
      ) {
        const selectedSuggestion = suggestions.find(
          (s) => s.name.toLowerCase() === query.toLowerCase()
        );
        if (
          selectedSuggestion &&
          (calculation === "" || operands.includes(calculation.slice(-1)))
        ) {
          addTag(selectedSuggestion.name);
          setCalculation((prev) => prev + selectedSuggestion.value.toString());
          setQuery("");
          setFilteredSuggestions([]);
        }
      }
    } else if (operands.includes(e.key)) {
      e.preventDefault(); // Prevent the default behavior of adding the operand to the input field
      addTag(e.key);
      setCalculation((prev) => prev + e.key);
      setQuery("");
    }
  };

  useEffect(() => {
    if (highlightedIndex >= 0 && suggestionRefs.current[highlightedIndex]) {
      suggestionRefs.current[highlightedIndex]?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [highlightedIndex]);

  const handleRemoveTag = (index: number) => {
    removeTag(index);

    const newFormula = formula.filter((_, i) => i !== index);
    const newCalculation = newFormula
      .map((tag, i) => {
        const suggestion = suggestions?.find((s) => s.name === tag);
        const value = suggestion ? suggestion.value.toString() : tag;
        return i > 0 &&
          !["+", "-", "*", "/", "(", ")", "^"].includes(newFormula[i - 1])
          ? "+" + value
          : value;
      })
      .join("");
    setCalculation(newCalculation);
  };

  const handleTagClick = (index: number) => {
    inputRef.current?.focus();
    setQuery(formula[index]);
    removeTag(index);
  };

  const calculateResult = () => {
    try {
      return eval(calculation);
    } catch {
      return "Error";
    }
  };

  return (
    <div className="flex flex-col items-center h-screen justify-center">
      <div>
        <div className="border">
          {formula.map((tag, index) => (
            <span
              key={index}
              onClick={() => handleTagClick(index)}
              className="bg-gray-300 mx-1 p-1 rounded-sm"
            >
              {tag}{" "}
              <button
                onClick={() => handleRemoveTag(index)}
                className="text-black/50"
              >
                | [x]
              </button>
            </span>
          ))}
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Type and press enter"
            className="p-2 rounded-md my-2 text-black outline-none"
          />
        </div>
        <div className="mt-4">
          <strong>Result: </strong>
          {calculateResult()}
        </div>
        {filteredSuggestions.length > 0 && (
          <ul className="max-h-40 overflow-y-scroll">
            {filteredSuggestions.map((suggestion, index) => (
              <li
                key={index}
                ref={(el) => {
                  if (el) {
                    suggestionRefs.current[index] = el;
                  }
                }}
                onClick={() => setQuery(suggestion.name)}
                className={
                  highlightedIndex === index ? "bg-blue-300 w-full" : ""
                }
              >
                <div className="flex justify-between p-2">
                  <p>{suggestion.name}</p>
                  <p>{suggestion.category}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default FormulaInput;

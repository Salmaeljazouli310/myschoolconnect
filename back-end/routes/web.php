<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

// Add this dummy route to prevent the error
Route::match(['get', 'post'], '/login', function () {
    return response()->json(['message' => 'Please use /api/v1/auth/login for API authentication'], 401);
})->name('login');

// Add a fallback for any web route
Route::fallback(function () {
    return response()->json(['message' => 'Route not found. Please check the API documentation.'], 404);
});
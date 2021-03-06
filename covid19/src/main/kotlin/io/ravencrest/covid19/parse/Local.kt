package io.ravencrest.covid19.parse

import java.nio.file.Files
import java.nio.file.Path
import java.nio.file.Paths

val isDev = Paths.get("./build.gradle").toAbsolutePath().toFile().exists()
val rootPath = if (isDev) "data" else ".."

// Population data is manually scraped from https://www.worldometers.info/world-population/population-by-country/ It'd be nice to find a better source
val globalPopulationPath: Path = Paths.get(rootPath, "global_population.csv").toAbsolutePath()
val usPopulationPath: Path = Paths.get(rootPath, "us_population.csv").toAbsolutePath()

// Manually generated list that maps the country labels in the population data to the COVID-19 time series country labels
val globalRegionsPath: Path = Paths.get(rootPath, "global_regions.csv").toAbsolutePath()

// Manually generated list that maps the country labels in the population data to the COVID-19 time series state labels
val usRegionsPath: Path = Paths.get(rootPath, "us_regions.csv").toAbsolutePath()

// Manually generated list for data we don't want to io.ravencrest.covid19.io.ravencrest.covid19.parse.parse
val blacklistPath: Path = Paths.get(rootPath, "blacklist.txt").toAbsolutePath()

val globalGdpPath: Path = Paths.get(rootPath, "global_gdp.csv").toAbsolutePath()
val usGdpPath: Path = Paths.get(rootPath, "us_gdp.csv").toAbsolutePath()

fun loadGlobalRegions(): Pair<Map<String, String>, Map<String, String>> {
  val map = mutableMapOf<String, String>()
  val countryCodes = mutableMapOf<String, String>()
  readCsvToStringArray(globalRegionsPath).forEach {
    val prefValue = it[0]
    val isoValue = it[1]
    val code = it[2]
    val normalizedValue = if (prefValue.isNullOrEmpty()) {
      isoValue
    } else {
      map[isoValue] = prefValue
      prefValue
    }
    countryCodes[normalizedValue] = code
    map[code] = normalizedValue

    for (i in 3 until it.size) {
      val key = it[i]
      map[key] = normalizedValue
    }
  }
  return Pair(map.toMap(), countryCodes.toMap())
}

fun loadUsRegions(): Map<String, String> {
  val countryCodes = mutableMapOf<String, String>()
  readCsvToStringArray(usRegionsPath).forEach {
    val prefValue = it[0]
    val letterCodeValue = it[1]
    countryCodes[prefValue] = letterCodeValue
  }
  return countryCodes.toMap()
}

private fun loadPopulations(regions: Map<String, String>?, path: Path): Map<String, Long> {
  val csvIterator =
    readCsvToStringArray(path)
  return csvIterator.asSequence().associateBy({ row -> row[0] }, { row -> row[1].toLong() }).toMutableMap()
    .let { populations ->
      // Combine territory populations with their sovereign state population
      regions?.forEach { (rawState, normalizedState) ->
        // Look up the territory and state names and map them to the appropriate key for the population data
        val normalizedPop = populations[normalizedState] ?: 0
        val rawPop = populations[rawState] ?: 0

        val population = normalizedPop + rawPop
        populations.remove(normalizedState)
        populations.remove(rawState)
        populations[normalizedState] = population
      }
      populations.toMap()
    }
}

fun loadGlobalPopulations(countries: Map<String, String>): Map<String, Long> {
  return loadPopulations(countries, globalPopulationPath)
}

fun loadUsPopulations(): Map<String, Long> {
  return loadPopulations(null, usPopulationPath)
}

fun loadBlacklist(): Set<String> {
  return Files.newBufferedReader(blacklistPath).readLines().toSet()
}

fun loadGlobalGdp(regions: Map<String, String>): Map<String, Double> {
  val map = mutableMapOf<String, Double>()
  val iterator = readCsvToStringArray(globalGdpPath)
  iterator.next()
  var i = 0
  iterator.forEach {
    i++
    val code = it[0]
    val rawRegion = it[1]
    val gdp = it.last().toDoubleOrNull()
    if (gdp == null) {
      println("Unable to convert GDP to number for $rawRegion and value ${it.last()}")
      return@forEach
    }
    val region = regions[code] ?: rawRegion
    map[region] = gdp
  }
  return map.toMap()
}

fun loadUsGdp(): Map<String, Double> {
  val map = mutableMapOf<String, Double>()
  val iterator = readCsvToStringArray(usGdpPath)
  iterator.next()
  iterator.forEach {
    val region = it[0].trim()
    val gdp = it.last().filter { c -> c != ',' }.toDoubleOrNull() ?: error("Unable to convert GDP to number for $region and value ${it.last()}")
    map[region] = gdp / 100_000
  }
  return map.toMap()
}

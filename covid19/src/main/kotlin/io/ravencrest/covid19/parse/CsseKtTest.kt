package io.ravencrest.covid19.parse

import java.nio.file.Paths

fun main() {
  val iter = readCsvToStringArray(Paths.get("./covid19/src/test/resources/ny.csv").toAbsolutePath())
  val countries = loadCountries()
  val data = parse(loadTimeSeries("csse_cases_us", CSSE_CASES_US_URL), 6, 11, countries.first).first()
  val expect = arrayOf(263292L, 263460L, 271590L)
  val points = data.points.map { point -> point.value }
  for (i in points.indices) {
    assert(points[i] == expect[i])
  }
}

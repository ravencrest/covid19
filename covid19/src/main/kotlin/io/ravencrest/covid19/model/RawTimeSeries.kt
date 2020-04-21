package io.ravencrest.covid19.model

import io.ravencrest.covid19.NORMALIZER
import java.time.LocalDate
import kotlin.math.roundToInt

data class RawTimeSeries(val country: String, val population: Long, val points: List<Double?>) {
  fun toTimeSeries(headers: List<LocalDate>): TimeSeries {
    val points = points.mapIndexed { index, item ->
      if (item != null) {
        Point(
          country = this.country,
          date = headers[index],
          rawValue = item,
          normalizedValue = ((item / this.population) * NORMALIZER).roundToInt(),
          population = this.population
        )
      } else {
        null
      }
    }.filterNotNull().toSet()
    return TimeSeries(
      country = this.country,
      population = population,
      points = points
    )
  }
}